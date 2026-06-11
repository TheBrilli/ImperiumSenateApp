// App.js
import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  View, Text, TouchableOpacity, TextInput, FlatList, ImageBackground,
  StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView,
  Platform, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const colors = {
  background: '#1A0B2E', gold: '#D4AF37', goldLight: '#F3E5AB', goldDark: '#B8860B',
  textWhite: '#F5F5F5', statusValid: '#2E7D32', statusDebet: '#C62828',
  glassDark: 'rgba(26,11,46,0.85)', borderGold: 'rgba(212,175,55,0.5)',
  senatorBubble: 'rgba(212,175,55,0.2)', citizenBubble: 'rgba(26,11,46,0.7)',
};

const typography = {
  title: { fontSize: 28, fontWeight: 'bold', letterSpacing: 1.5, color: colors.gold },
  body: { fontSize: 14, color: colors.textWhite },
  goldLink: { fontSize: 12, color: colors.gold, textTransform: 'uppercase', fontWeight: '500' },
  spqr: { fontSize: 48, fontWeight: 'bold', color: colors.gold },
};

const initialState = { user: null, isLoggedIn: false, chronicleEntries: [], chatGroups: [], currentGroupId: null };
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER': return { ...state, user: action.payload, isLoggedIn: true };
    case 'UPDATE_TAX_STATUS': if (!state.user) return state; return { ...state, user: { ...state.user, taxStatus: action.payload } };
    case 'SET_AUTO_DONATE': if (!state.user) return state; const { enabled, method } = action.payload; const newMethod = enabled ? (method ?? state.user.autoDonateMethod) : null; return { ...state, user: { ...state.user, autoDonate: enabled, autoDonateMethod: newMethod } };
    case 'SET_LANGUAGE': if (!state.user) return state; return { ...state, user: { ...state.user, language: action.payload } };
    case 'ADD_CHRONICLE_ENTRY': return { ...state, chronicleEntries: [action.payload, ...state.chronicleEntries] };
    case 'LOGOUT': return initialState;
    case 'ADD_MESSAGE': const idx = state.chatGroups.findIndex(g => g.id === action.payload.groupId); if (idx === -1) return state; const groups = [...state.chatGroups]; groups[idx] = { ...groups[idx], messages: [...groups[idx].messages, action.payload.message] }; return { ...state, chatGroups: groups };
    case 'ADD_REACTION': const gIdx = state.chatGroups.findIndex(g => g.id === action.payload.groupId); if (gIdx === -1) return state; const mIdx = state.chatGroups[gIdx].messages.findIndex(m => m.id === action.payload.messageId); if (mIdx === -1) return state; const existing = state.chatGroups[gIdx].messages[mIdx].reactions; const alreadyHas = existing.some(r => r.userId === action.payload.reaction.userId && r.emoji === action.payload.reaction.emoji); if (alreadyHas) return state; const groups2 = [...state.chatGroups]; const messages = [...groups2[gIdx].messages]; messages[mIdx] = { ...messages[mIdx], reactions: [...messages[mIdx].reactions, action.payload.reaction] }; groups2[gIdx] = { ...groups2[gIdx], messages }; return { ...state, chatGroups: groups2 };
    case 'CREATE_GROUP': return { ...state, chatGroups: [...state.chatGroups, action.payload] };
    case 'SET_CURRENT_GROUP': return { ...state, currentGroupId: action.payload };
    default: return state;
  }
};

const AppContext = createContext();
const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => { const load = async () => { try { const json = await AsyncStorage.getItem('user'); if (json) dispatch({ type: 'SET_USER', payload: JSON.parse(json) }); } catch (e) {} }; load(); }, []);
  useEffect(() => { if (state.user) AsyncStorage.setItem('user', JSON.stringify(state.user)); }, [state.user]);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};
const useApp = () => { const ctx = useContext(AppContext); if (!ctx) throw new Error('useApp must be used within AppProvider'); return ctx; };

const GoldButton = ({ title, onPress, variant = 'primary', icon, loading }) => {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity style={[styles.goldButton, isPrimary ? styles.goldButtonPrimary : styles.goldButtonSecondary]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color={isPrimary ? colors.background : colors.gold} /> : <>{icon && <Text style={styles.goldButtonIcon}>{icon}</Text>}<Text style={[styles.goldButtonText, isPrimary ? styles.goldButtonTextPrimary : styles.goldButtonTextSecondary]}>{title}</Text></>}
    </TouchableOpacity>
  );
};

const BudgetWidget = ({ total, quarterly }) => (
  <View style={styles.budgetWidget}>
    <Text style={[typography.goldLink, { marginBottom: 8 }]}>AERARIUM • Бюджет Империи</Text>
    <Text style={[typography.title, { fontSize: 32, marginBottom: 12 }]}>{total} Sestertii</Text>
    <View style={styles.budgetRow}><Text style={styles.budgetLabel}>Собрано за квартал:</Text><Text style={styles.budgetValue}>{quarterly} Sestertii</Text></View>
  </View>
);

const LoginScreen = ({ navigation }) => {
  const { dispatch } = useApp();
  const budget = { total: '12,847,500', quarterly: '3,210,000' };
  const handleLogin = () => {
    const mockUser = { id: 'citizen1', name: 'Гай Юлий Цезарь', passportId: 'SPQR-0421', passportImageUrl: 'https://randomuser.me/api/portraits/men/1.jpg', expiryDate: '01.01.2026', language: 'ru', taxStatus: 'DEBET', autoDonate: false, autoDonateMethod: null, balance: 1000, role: 'citizen', passportType: 'Legionarius' };
    dispatch({ type: 'SET_USER', payload: mockUser });
    navigation.replace('DashboardDebet');
  };
  return (
    <ImageBackground source={{ uri: 'https://www.transparenttextures.com/patterns/marble.png' }} style={styles.bg}>
      <View style={styles.overlay}>
        <Text style={[typography.goldLink, { textAlign: 'center' }]}>imperium tuum verbum</Text>
        <Text style={[typography.spqr, { textAlign: 'center', marginVertical: 20 }]}>SPQR</Text>
        <BudgetWidget total={budget.total} quarterly={budget.quarterly} />
        <GoldButton title="Купить Римский Паспорт (NFT)" onPress={() => Alert.alert('Демо', 'Покупка паспорта')} variant="primary" icon="⚡" />
        <GoldButton title="Войти по Паспорту" onPress={handleLogin} variant="secondary" />
        <Text style={[typography.body, { textAlign: 'center', marginVertical: 10 }]}>⚖️ Доступ к Чату Сената после уплаты квартального налога</Text>
        <View style={styles.bottomRow}>
          <GoldButton title="МАНИФЕСТ" onPress={() => Alert.alert('Манифест', 'Текст Манифеста Империи')} variant="secondary" />
          <GoldButton title="КОНСТИТУЦИЯ" onPress={() => Alert.alert('Конституция', 'Текст Конституции')} variant="secondary" />
          <GoldButton title="АРХИВ ПАСПОРТОВ" onPress={() => navigation.navigate('NftArchive')} variant="secondary" />
        </View>
      </View>
    </ImageBackground>
  );
};

const DashboardDebetScreen = ({ navigation }) => {
  const { state, dispatch } = useApp();
  const user = state.user;
  if (!user) return <View style={styles.containerCentered}><Text style={styles.cardText}>Ошибка: пользователь не найден</Text><GoldButton title="На главную" onPress={() => navigation.replace('Login')} variant="primary" /></View>;
  return (
    <ImageBackground source={{ uri: 'https://www.transparenttextures.com/patterns/marble.png' }} style={styles.bg}>
      <View style={styles.overlay}>
        <Text style={[typography.goldLink, { textAlign: 'center' }]}>imperium tuum verbum</Text>
        <Text style={[typography.spqr, { fontSize: 32, textAlign: 'center', marginVertical: 16 }]}>SPQR</Text>
        <View style={styles.card}><Text style={[typography.title, { fontSize: 24 }]}>{user.name}</Text><Text style={styles.cardText}>{user.passportId}</Text><View style={styles.row}><Text style={styles.cardText}>Налог:</Text><Text style={{ color: colors.statusDebet, fontWeight: 'bold' }}>DEBET</Text></View></View>
        <View style={styles.blocked}><Text style={{ fontSize: 48, color: colors.gold, marginBottom: 8 }}>🔒</Text><Text style={styles.cardText}>Чат заблокирован до уплаты налога</Text></View>
        <GoldButton title="Перейти в Казначейство" onPress={() => navigation.navigate('Treasury')} variant="primary" />
        <GoldButton title="Выйти" onPress={() => { Alert.alert('Выход', 'Вы уверены?', [{ text: 'Отмена', style: 'cancel' }, { text: 'Выйти', style: 'destructive', onPress: () => { dispatch({ type: 'LOGOUT' }); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); } }]); }} variant="secondary" />
        <View style={styles.bottomRow}><GoldButton title="МАНИФЕСТ" onPress={() => Alert.alert('Манифест', '...')} variant="secondary" /><GoldButton title="КОНСТИТУЦИЯ" onPress={() => Alert.alert('Конституция', '...')} variant="secondary" /></View>
      </View>
    </ImageBackground>
  );
};

const DashboardSolvitScreen = ({ navigation }) => {
  const { state, dispatch } = useApp();
  const user = state.user;
  if (!user) return <View style={styles.containerCentered}><Text style={styles.cardText}>Ошибка: пользователь не найден</Text><GoldButton title="На главную" onPress={() => navigation.replace('Login')} variant="primary" /></View>;
  return (
    <ImageBackground source={{ uri: 'https://www.transparenttextures.com/patterns/marble.png' }} style={styles.bg}>
      <View style={styles.overlay}>
        <Text style={[typography.goldLink, { textAlign: 'center' }]}>imperium tuum verbum</Text>
        <Text style={[typography.spqr, { fontSize: 32, textAlign: 'center', marginVertical: 16 }]}>SPQR</Text>
        <View style={styles.card}><Text style={[typography.title, { fontSize: 24 }]}>{user.name}</Text><Text style={styles.cardText}>{user.passportId}</Text><View style={styles.row}><Text style={styles.cardText}>Налог:</Text><Text style={{ color: colors.statusValid, fontWeight: 'bold' }}>SOLVIT</Text></View></View>
        <GoldButton title="Войти в чат Совета" onPress={() => navigation.navigate('ChatMain')} variant="primary" icon="🚪" />
        <GoldButton title="Профиль" onPress={() => navigation.navigate('Profile', { userId: user.id })} variant="secondary" />
        {user.role === 'senator' && <GoldButton title="Top Secret" onPress={() => navigation.navigate('TopSecretGate')} variant="secondary" icon="🔒" />}
        <GoldButton title="Выйти" onPress={() => { Alert.alert('Выход', 'Вы уверены?', [{ text: 'Отмена', style: 'cancel' }, { text: 'Выйти', style: 'destructive', onPress: () => { dispatch({ type: 'LOGOUT' }); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); } }]); }} variant="secondary" />
        <View style={styles.bottomRow}><GoldButton title="МАНИФЕСТ" onPress={() => Alert.alert('Манифест', '...')} variant="secondary" /><GoldButton title="КОНСТИТУЦИЯ" onPress={() => Alert.alert('Конституция', '...')} variant="secondary" /></View>
      </View>
    </ImageBackground>
  );
};

const ProfileScreen = ({ route }) => {
  const { state } = useApp();
  const { userId } = route.params;
  const currentUser = state.user;
  if (!currentUser) return <View style={styles.containerCentered}><Text style={styles.cardText}>Ошибка: не авторизован</Text></View>;
  const viewedUser = currentUser.id === userId ? currentUser : { ...currentUser, id: userId, name: userId === 'sen1' ? 'Marcus Tullius' : 'Lucius Assistant', role: userId === 'sen1' ? 'senator' : 'assistant', largeAvatarUrl: 'https://randomuser.me/api/portraits/men/2.jpg', passportImageUrl: 'https://randomuser.me/api/portraits/men/1.jpg', passportType: 'Aureus' };
  const hasLargeAvatar = viewedUser.role === 'senator' || viewedUser.role === 'assistant';
  return (
    <ScrollView style={styles.profileContainer}>
      <Text style={[typography.title, { textAlign: 'center', marginBottom: 20 }]}>PROFILVM</Text>
      <View style={styles.avatarRow}>
        <View style={styles.avatarWrapper}><ImageBackground source={{ uri: viewedUser.passportImageUrl }} style={styles.circleAvatar} /><Text style={styles.avatarLabel}>Обычный</Text></View>
        {hasLargeAvatar && <View style={styles.avatarWrapper}><ImageBackground source={{ uri: viewedUser.largeAvatarUrl || viewedUser.passportImageUrl }} style={styles.squareAvatar} /><Text style={styles.avatarLabel}>Парадный</Text></View>}
      </View>
      <View style={styles.card}>
        <Text style={[typography.title, { fontSize: 24 }]}>{viewedUser.name}</Text>
        <Text style={styles.cardText}>{viewedUser.passportId}</Text>
        <Text style={styles.cardText}>Тип: {viewedUser.passportType}</Text>
        <Text style={styles.cardText}>Действителен до: {viewedUser.expiryDate}</Text>
        {hasLargeAvatar && <Text style={[typography.goldLink, { marginTop: 8 }]}>⚡ {viewedUser.role === 'senator' ? 'СЕНАТОР' : 'АССИСТЕНТ'}</Text>}
      </View>
      {currentUser.id === viewedUser.id && (
        <>
          <View style={styles.settingsCard}>
            <Text style={[typography.goldLink, { fontSize: 18 }]}>Настройки</Text>
            <View style={styles.settingRow}><Text style={styles.cardText}>Язык перевода:</Text><Text style={{ color: colors.gold }}>{currentUser.language.toUpperCase()}</Text></View>
            <View style={styles.settingRow}><Text style={styles.cardText}>Авто-налог:</Text><Text style={{ color: colors.gold }}>{currentUser.autoDonate ? `Вкл (${currentUser.autoDonateMethod})` : 'Выкл'}</Text></View>
          </View>
          <GoldButton title="Обратная связь" onPress={() => Alert.alert('Обратная связь', 'Форма отправки')} variant="secondary" />
          {currentUser.role === 'citizen' && <GoldButton title="Вызвать сенатора на дебаты" onPress={() => Alert.alert('Демо', 'Вызов сенатора')} variant="secondary" />}
          {currentUser.role === 'senator' && <GoldButton title="Вызовы граждан" onPress={() => Alert.alert('Демо', 'Список вызовов')} variant="secondary" />}
          <GoldButton title="Летопись" onPress={() => Alert.alert('Летопись', 'История событий...')} variant="secondary" />
        </>
      )}
    </ScrollView>
  );
};

const ChatMainScreen = () => {
  const { state, dispatch } = useApp();
  const [newGroupName, setNewGroupName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const user = state.user;
  if (!user) return <Text style={styles.cardText}>Ошибка: не авторизован</Text>;
  const canWrite = user.role === 'senator' || user.role === 'assistant';
  const canCreateGroup = user.role === 'senator';
  useEffect(() => {
    if (state.chatGroups.length === 0) {
      const mainGroup = { id: 'main', name: 'Общий чат Сената', createdBy: 'system', members: [], messages: [{ id: '1', userId: 'sen1', userName: 'Marcus Senator', role: 'senator', text: 'Добро пожаловать в Сенат!', timestamp: new Date().toLocaleTimeString(), reactions: [] }], isOpen: true };
      dispatch({ type: 'CREATE_GROUP', payload: mainGroup });
      dispatch({ type: 'SET_CURRENT_GROUP', payload: 'main' });
    }
  }, []);
  const currentGroup = state.chatGroups.find(g => g.id === state.currentGroupId);
  const [inputText, setInputText] = useState('');
  const [reactionPickerVisible, setReactionPickerVisible] = useState(null);
  const sendMessage = () => { if (!currentGroup) return; if (!canWrite) { Alert.alert('Право голоса', 'Только сенаторы и ассистенты могут писать.'); return; } if (!inputText.trim()) return; const newMessage = { id: Date.now().toString(), userId: user.id, userName: user.name, role: user.role, text: inputText, timestamp: new Date().toLocaleTimeString(), reactions: [] }; dispatch({ type: 'ADD_MESSAGE', payload: { groupId: currentGroup.id, message: newMessage } }); setInputText(''); };
  const addReaction = (messageId, emoji) => { if (!currentGroup) return; dispatch({ type: 'ADD_REACTION', payload: { groupId: currentGroup.id, messageId, reaction: { userId: user.id, emoji } } }); setReactionPickerVisible(null); };
  const createNewGroup = () => { if (!newGroupName.trim()) return; const newGroup = { id: Date.now().toString(), name: newGroupName, createdBy: user.id, members: [user.id], messages: [], isOpen: true }; dispatch({ type: 'CREATE_GROUP', payload: newGroup }); const systemMessage = { id: Date.now().toString() + '_sys', userId: 'system', userName: 'Система', role: 'assistant', text: `Сенатор ${user.name} создал группу "${newGroupName}".`, timestamp: new Date().toLocaleTimeString(), reactions: [] }; dispatch({ type: 'ADD_MESSAGE', payload: { groupId: newGroup.id, message: systemMessage } }); setNewGroupName(''); setModalVisible(false); dispatch({ type: 'SET_CURRENT_GROUP', payload: newGroup.id }); };
  const renderMessage = ({ item }) => { const isSenatorMsg = item.role === 'senator' || item.role === 'assistant'; return ( <View style={[styles.messageBubble, isSenatorMsg ? styles.senatorBubble : styles.citizenBubble]}><Text style={[typography.goldLink, { marginBottom: 4 }]}>{item.userName} {item.role === 'senator' && '⚡'}</Text><Text style={[typography.body, { flexShrink: 1 }]}>{item.text}</Text><View style={styles.reactionRow}>{item.reactions.map((r, idx) => <Text key={idx} style={{ fontSize: 14, marginRight: 6 }}>{r.emoji}</Text>)}<TouchableOpacity onPress={() => setReactionPickerVisible(item.id)}><Text style={{ fontSize: 16, color: colors.goldLight }}>➕</Text></TouchableOpacity></View><Text style={styles.timestamp}>{item.timestamp}</Text>{reactionPickerVisible === item.id && <View style={styles.reactionPicker}>{['👍', '❤️', '😂', '😮', '👎'].map(emoji => <TouchableOpacity key={emoji} onPress={() => addReaction(item.id, emoji)}><Text style={{ fontSize: 24, marginHorizontal: 8 }}>{emoji}</Text></TouchableOpacity>)}</View>}</View> ); };
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.tabBar}><ScrollView horizontal>{state.chatGroups.map(group => <TouchableOpacity key={group.id} style={[styles.tab, state.currentGroupId === group.id && styles.activeTab]} onPress={() => dispatch({ type: 'SET_CURRENT_GROUP', payload: group.id })}><Text style={[typography.goldLink, state.currentGroupId === group.id && { color: colors.goldLight }]}>{group.name}</Text></TouchableOpacity>)}</ScrollView>{canCreateGroup && <TouchableOpacity style={styles.addTabButton} onPress={() => setModalVisible(true)}><Text style={{ fontSize: 24, color: colors.gold }}>+</Text></TouchableOpacity>}</View>
      {currentGroup ? <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}><FlatList data={currentGroup.messages} keyExtractor={item => item.id} renderItem={renderMessage} contentContainerStyle={{ padding: 16, paddingBottom: 20 }} />{canWrite ? <View style={styles.inputRow}><TextInput style={styles.chatInput} placeholder="Написать..." placeholderTextColor="#aaa" value={inputText} onChangeText={setInputText} multiline /><GoldButton title="Отправить" onPress={sendMessage} variant="primary" /></View> : <View style={styles.readOnlyBar}><Text style={styles.readOnlyText}>✋ Только чтение. Реакции разрешены.</Text></View>}</KeyboardAvoidingView> : <Text style={[typography.body, { textAlign: 'center', marginTop: 50 }]}>Выберите чат</Text>}
      <Modal visible={modalVisible} animationType="slide" transparent><View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={[typography.title, { fontSize: 20 }]}>Создать подгруппу</Text><TextInput style={styles.modalInput} placeholder="Название чата" value={newGroupName} onChangeText={setNewGroupName} /><GoldButton title="Создать" onPress={createNewGroup} variant="primary" /><GoldButton title="Отмена" onPress={() => setModalVisible(false)} variant="secondary" /></View></View></Modal>
    </View>
  );
};

const TopSecretGateScreen = ({ navigation }) => {
  const { state } = useApp();
  if (state.user?.role === 'senator') return <View style={styles.containerCentered}><Text style={[typography.title, { textAlign: 'center' }]}>🔺 TOP SECRET CHAT</Text><Text style={typography.body}>Содержимое только для сенаторов</Text><GoldButton title="Назад" onPress={() => navigation.goBack()} variant="secondary" /></View>;
  return <View style={styles.containerCentered}><Text style={[typography.title, { color: colors.statusDebet }]}>Доступ запрещён</Text><GoldButton title="Назад" onPress={() => navigation.goBack()} variant="secondary" /></View>;
};
const NftArchiveScreen = ({ navigation }) => <View style={styles.containerCentered}><Text style={typography.title}>Архив паспортов</Text><GoldButton title="Назад" onPress={() => navigation.goBack()} variant="secondary" /></View>;
const TreasuryScreen = ({ navigation }) => { const [loading, setLoading] = useState(false); const handlePay = () => { setLoading(true); setTimeout(() => { Alert.alert('Успех', 'Налог оплачен (демо)'); setLoading(false); }, 1500); }; return <View style={styles.containerCentered}><Text style={typography.title}>Казначейство</Text><GoldButton title="Оплатить налог" onPress={handlePay} variant="primary" loading={loading} /><GoldButton title="Назад" onPress={() => navigation.goBack()} variant="secondary" /></View>; };

const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="DashboardDebet" component={DashboardDebetScreen} />
          <Stack.Screen name="DashboardSolvit" component={DashboardSolvitScreen} />
          <Stack.Screen name="ChatMain" component={ChatMainScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="TopSecretGate" component={TopSecretGateScreen} />
          <Stack.Screen name="NftArchive" component={NftArchiveScreen} />
          <Stack.Screen name="Treasury" component={TreasuryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 }, overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 20, paddingTop: 60 }, bottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto', marginBottom: 30, gap: 8 },
  card: { backgroundColor: colors.glassDark, borderWidth: 1, borderColor: colors.borderGold, borderRadius: 16, padding: 20, marginVertical: 20 }, cardText: { color: colors.textWhite, marginBottom: 4 }, row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  blocked: { alignItems: 'center', marginVertical: 30 },
  goldButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, marginVertical: 8, width: '100%' },
  goldButtonPrimary: { backgroundColor: colors.goldDark }, goldButtonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.gold },
  goldButtonIcon: { marginRight: 8, fontSize: 16, color: colors.textWhite }, goldButtonText: { fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  goldButtonTextPrimary: { color: colors.textWhite }, goldButtonTextSecondary: { color: colors.gold },
  budgetWidget: { backgroundColor: colors.glassDark, borderWidth: 1, borderColor: colors.borderGold, borderRadius: 16, padding: 16, margin: 16 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between' }, budgetLabel: { color: colors.textWhite }, budgetValue: { color: colors.gold, fontWeight: 'bold' },
  profileContainer: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 60 },
  avatarRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30, gap: 24 }, avatarWrapper: { alignItems: 'center' },
  circleAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: colors.gold, resizeMode: 'cover' },
  squareAvatar: { width: 100, height: 100, borderRadius: 12, borderWidth: 2, borderColor: colors.goldLight, resizeMode: 'cover' },
  avatarLabel: { color: colors.goldLight, fontSize: 10, marginTop: 8 }, settingsCard: { backgroundColor: 'rgba(212,175,55,0.1)', borderRadius: 12, padding: 16, marginBottom: 24 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.borderGold },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderGold, backgroundColor: colors.background }, tab: { paddingVertical: 12, paddingHorizontal: 20 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.gold }, addTabButton: { paddingHorizontal: 12, justifyContent: 'center' },
  chatInput: { flex: 1, backgroundColor: '#2A1A3A', borderRadius: 8, paddingHorizontal: 12, color: colors.textWhite, marginRight: 8, maxHeight: 80 },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: colors.borderGold, backgroundColor: 'rgba(0,0,0,0.5)' },
  readOnlyBar: { padding: 12, borderTopWidth: 1, borderTopColor: colors.borderGold, alignItems: 'center' }, readOnlyText: { color: colors.goldLight, fontSize: 12 },
  messageBubble: { borderRadius: 12, padding: 12, marginBottom: 12, flexShrink: 1 }, senatorBubble: { backgroundColor: colors.senatorBubble, borderWidth: 0.5, borderColor: colors.gold },
  citizenBubble: { backgroundColor: colors.citizenBubble, borderWidth: 0.5, borderColor: colors.borderGold }, timestamp: { fontSize: 10, color: colors.goldLight, textAlign: 'right', marginTop: 4 },
  reactionRow: { flexDirection: 'row', marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }, reactionPicker: { flexDirection: 'row', marginTop: 6, backgroundColor: '#2A1A3A', padding: 6, borderRadius: 20, alignSelf: 'flex-start' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }, modalContent: { backgroundColor: colors.background, padding: 20, borderRadius: 16, width: '80%', borderWidth: 1, borderColor: colors.gold },
  modalInput: { backgroundColor: '#2A1A3A', borderRadius: 8, padding: 10, color: colors.textWhite, marginVertical: 12 }, containerCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 20 },
});