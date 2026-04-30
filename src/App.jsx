import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FolderOpen, Edit3, MessageSquare, AlertCircle, Save, FileText, CheckCircle2, Clock, Send, Link as LinkIcon, Plus, Pencil, X, User, Settings, Cloud, ExternalLink, Trash2 } from 'lucide-react';

// --- Firebase Initialization (Follows Strict Rules) ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

let app, auth, db, appId;
let isFirebaseReady = false;

const firebaseConfig = {
  apiKey: "AIzaSyDavgMvqO-A5ZD-0-McQm_9_DAe8l4Hrhk",
  authDomain: "reading-115.firebaseapp.com",
  projectId: "reading-115",
  storageBucket: "reading-115.firebasestorage.app",
  messagingSenderId: "388060451674",
  appId: "1:388060451674:web:2260a3e9b88f442ba69963"
};

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = '115reading';  // 您的專案名稱
  isFirebaseReady = true;
} catch (error) {
  console.error("Firebase init error:", error);
}

// --- Constants & Data Structures ---
const INDICATORS = [
  {
    id: '1', title: '指標一：閱讀推動之理念、目標及組織架構',
    subItems: [
      { id: '1-1', title: '(1) 閱讀推動之理念及其發展脈絡。', defaultHint: '委員建議：核心意象無論採「春夏秋冬」或「跨域」，都必須從校本課程中「淬鍊出閱讀的元素」。文本中需拉出時間軸展現脈絡的演進。' },
      { id: '1-2', title: '(2) 依據理念規劃實踐的閱讀推動短中長期程目標內涵。', defaultHint: '委員建議寫作三部曲：先盤點校內現有資源與課程（如「知、行、創」架構），再思考方向放入指標框架中。' },
      { id: '1-3', title: '(3) 閱讀推動之組織架構與人員分工合作之內容。' },
      { id: '1-4', title: '(4) 其他。' },
    ]
  },
  {
    id: '2', title: '指標二：閱讀資源整合與環境營造',
    subItems: [
      { id: '2-1', title: '(1) 有效整合運用學校內外部資源推動閱讀。', defaultHint: '共筆重點：內外部資源整合、閱讀輕旅行、食農/芝麻校本資源結合' },
      { id: '2-2', title: '(2) 優化學校閱讀環境提升學生閱讀學習成效。', defaultHint: '共筆重點：實體環境優化' },
      { id: '2-3', title: '(3) 資源整合提供學生數位閱讀學習課程。', defaultHint: '共筆重點：生生用平板、搭配 Kahoot 等數位平台' },
      { id: '2-4', title: '(4) 其他。' },
    ]
  },
  {
    id: '3', title: '指標三：閱讀教學之規劃與實施',
    subItems: [
      { id: '3-1', title: '(1) 閱讀教學計畫、執行及檢核之品質。', defaultHint: '共筆重點：課程品質維護與滾動式修正' },
      { id: '3-2', title: '(2) 圖書館資訊利用教育之規劃及執行。', defaultHint: '⚠️委員重點指出缺口：「圖書館資訊利用教育課程」需要被結構化地呈現。' },
      { id: '3-3', title: '(3) 多元文本閱讀課程之規劃及執行。', defaultHint: '⚠️委員重點指出缺口：真正的「數位閱讀學習課程」需要被結構化地呈現。' },
      { id: '3-4', title: '(4) 各學習領域閱讀策略教學之規劃及執行。', defaultHint: '共筆重點：各領域融入' },
      { id: '3-5', title: '(5) 其他。' },
    ]
  },
  {
    id: '4', title: '指標四：學生閱讀學習成效及影響',
    subItems: [
      { id: '4-1', title: '(1) 學生閱讀能力及閱讀興趣之提升。', defaultHint: '共筆重點：SPARKLE 核心素養展現、閱讀興趣提升數據' },
      { id: '4-2', title: '(2) 學生閱讀個別差異之輔導及協助。', defaultHint: '共筆重點：拔尖扶助成果' },
      { id: '4-3', title: '(3) 學生運用閱讀能力進行重大議題之探究活動。' },
      { id: '4-4', title: '(4) 其他。' },
    ]
  },
  {
    id: '5', title: '指標五：閱讀推動專業精進與社群發展',
    subItems: [
      { id: '5-1', title: '(1) 閱讀推動人員閱讀專業成長情形。' },
      { id: '5-2', title: '(2) 閱讀推動人員閱讀教學社群成長情形。', defaultHint: '共筆重點：三大核心社群（低/中/高年級）運作機制、共備與觀議課紀錄' },
      { id: '5-3', title: '(3) 閱讀推動組織及成員之專業發展機制。' },
      { id: '5-4', title: '(4) 其他。' },
    ]
  }
];

const DEFAULT_DASHBOARD_NOTE = `1. 核心意象：無論採「春夏秋冬」或「跨閱」，都必須從校本課程中「淬鍊出閱讀的元素」。
2. 兩大缺口需補足：務必結構化呈現「圖書館資訊利用教育課程」與「數位閱讀學習課程」。
3. 寫作三部曲：先讀(歷屆範本) ➡️ 再盤(校內現有資源) ➡️ 後寫(填入指標框架)。`;

// Helper: Extract Google Drive Folder ID from URL
const extractDriveId = (url) => {
  if (!url) return null;
  try {
    const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    const urlObj = new URL(url);
    return urlObj.searchParams.get('id');
  } catch (e) {
    return null;
  }
};

// --- Main Application Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [showSettings, setShowSettings] = useState(false); 
  
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(localStorage.getItem('user_name') || '未命名夥伴');
  
  const [texts, setTexts] = useState({});
  const [messages, setMessages] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [dashboardNote, setDashboardNote] = useState(DEFAULT_DASHBOARD_NOTE);
  const [customHints, setCustomHints] = useState({});
  const [sharedDriveLink, setSharedDriveLink] = useState('https://drive.google.com/drive/folders/1OfcAH4nraC_UPGK2L_IlLXGjqETZIlv9');
  
  const [isEditingDashboardNote, setIsEditingDashboardNote] = useState(false);
  const [tempDashboardNote, setTempDashboardNote] = useState('');
  const [editingHintId, setEditingHintId] = useState(null);
  const [tempHintContent, setTempHintContent] = useState('');
  const [isEditingDriveLink, setIsEditingDriveLink] = useState(false);
  const [tempDriveLink, setTempDriveLink] = useState('');
  
  const [inputMsg, setInputMsg] = useState(''); 
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceUrlTitle, setResourceUrlTitle] = useState('');

  // Auth Effect
  useEffect(() => {
    if (!isFirebaseReady) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Fetching Effect
  useEffect(() => {
    if (!user || !isFirebaseReady) return;

    const textsRef = collection(db, 'artifacts', appId, 'public', 'data', 'co_edit_texts');
    const unsubTexts = onSnapshot(textsRef, (snapshot) => {
      const newTexts = {};
      snapshot.forEach(doc => { newTexts[doc.id] = doc.data().content; });
      setTexts(newTexts);
    }, (err) => console.error(err));

    const msgsRef = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    const unsubMsgs = onSnapshot(msgsRef, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => {
        const timeA = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : Date.now();
        const timeB = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : Date.now();
        return timeA - timeB;
      });
      setMessages(msgs);
    }, (err) => console.error(err));

    const resRef = collection(db, 'artifacts', appId, 'public', 'data', 'resources');
    const unsubRes = onSnapshot(resRef, (snapshot) => {
      const res = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.sort((a, b) => {
        const timeA = typeof a.uploadedAt?.toMillis === 'function' ? a.uploadedAt.toMillis() : Date.now();
        const timeB = typeof b.uploadedAt?.toMillis === 'function' ? b.uploadedAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      setResources(res);
    }, (err) => console.error(err));

    const settingsRef = collection(db, 'artifacts', appId, 'public', 'data', 'platform_settings');
    const unsubSettings = onSnapshot(settingsRef, (snapshot) => {
      snapshot.forEach(doc => {
        if(doc.id === 'dashboard_note' && doc.data().content !== undefined) {
          setDashboardNote(doc.data().content);
        }
        if(doc.id === 'shared_drive' && doc.data().link !== undefined) {
          setSharedDriveLink(doc.data().link);
        }
      });
    }, (err) => console.error(err));

    const hintsRef = collection(db, 'artifacts', appId, 'public', 'data', 'indicator_hints');
    const unsubHints = onSnapshot(hintsRef, (snapshot) => {
      const newHints = {};
      snapshot.forEach(doc => { newHints[doc.id] = doc.data().content; });
      setCustomHints(newHints);
    }, (err) => console.error(err));

    return () => {
      unsubTexts();
      unsubMsgs();
      unsubRes();
      unsubSettings();
      unsubHints();
    };
  }, [user]);

  // --- Handlers ---
  const handleUpdateName = (e) => {
    setUserName(e.target.value);
    localStorage.setItem('user_name', e.target.value);
  };

  const handleSaveDashboardNote = async () => {
    if (!user || !isFirebaseReady) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'platform_settings', 'dashboard_note');
      await setDoc(docRef, { content: tempDashboardNote, lastUpdatedBy: userName, updatedAt: serverTimestamp() }, { merge: true });
      setIsEditingDashboardNote(false);
    } catch (err) { console.error(err); }
  };

  const handleSaveDriveLink = async () => {
    if (!user || !isFirebaseReady) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'platform_settings', 'shared_drive');
      await setDoc(docRef, { link: tempDriveLink.trim(), lastUpdatedBy: userName, updatedAt: serverTimestamp() }, { merge: true });
      setIsEditingDriveLink(false);
    } catch (err) { console.error(err); }
  };

  const handleSaveHint = async (subId) => {
    if (!user || !isFirebaseReady) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'indicator_hints', subId);
      await setDoc(docRef, { content: tempHintContent, lastUpdatedBy: userName, updatedAt: serverTimestamp() }, { merge: true });
      setEditingHintId(null);
    } catch (err) { console.error(err); }
  };

  const handleSaveText = async (indicatorId, content) => {
    if (!user || !isFirebaseReady) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'co_edit_texts', indicatorId);
      await setDoc(docRef, { content: content, lastUpdatedBy: userName, lastUpdatedAt: serverTimestamp() }, { merge: true });
    } catch (err) { console.error("Save error:", err); }
  };

  const handleSendMessage = async (text) => {
    if (!user || !isFirebaseReady || !text.trim()) return;
    try {
      const msgsRef = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
      await addDoc(msgsRef, { text: text, author: userName, createdAt: serverTimestamp() });
    } catch (err) { console.error("Message error:", err); }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!user || !isFirebaseReady) return;
    try {
      const msgRef = doc(db, 'artifacts', appId, 'public', 'data', 'messages', msgId);
      await deleteDoc(msgRef);
    } catch (err) { console.error("Delete message error:", err); }
  };

  const handleAddUrl = async () => {
    if (!user || !isFirebaseReady || !resourceUrl.trim()) return;
    try {
      const resRef = collection(db, 'artifacts', appId, 'public', 'data', 'resources');
      await addDoc(resRef, {
        name: resourceUrlTitle.trim() || resourceUrl,
        link: resourceUrl,
        type: 'link',
        uploader: userName,
        uploadedAt: serverTimestamp()
      });
      setResourceUrl('');
      setResourceUrlTitle('');
    } catch (err) { console.error("Add URL error:", err); }
  };

  // --- Render Functions ---
  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-lg shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-amber-200 pb-2">
            <div className="flex items-center">
              <AlertCircle className="text-amber-600 mr-2" size={24} />
              <h3 className="text-lg font-bold text-amber-800">重要提醒便利貼 (委員建議)</h3>
            </div>
            {!isEditingDashboardNote ? (
              <button onClick={() => { setTempDashboardNote(dashboardNote); setIsEditingDashboardNote(true); }} className="text-amber-700 hover:bg-amber-100 p-1.5 rounded transition flex items-center text-sm font-medium">
                <Pencil size={14} className="mr-1" /> 編輯內容
              </button>
            ) : (
              <div className="flex space-x-2">
                <button onClick={() => setIsEditingDashboardNote(false)} className="text-gray-500 hover:bg-gray-100 p-1.5 rounded transition"><X size={16} /></button>
                <button onClick={handleSaveDashboardNote} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded transition flex items-center text-sm font-medium"><Save size={14} className="mr-1" /> 儲存</button>
              </div>
            )}
          </div>
          <div className="flex-1">
            {isEditingDashboardNote ? (
              <textarea className="w-full h-full min-h-[150px] p-3 border border-amber-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500" value={tempDashboardNote} onChange={(e) => setTempDashboardNote(e.target.value)} placeholder="請輸入給團隊的重要提醒..." />
            ) : (
              <div className="text-amber-900 whitespace-pre-wrap leading-relaxed">{dashboardNote}</div>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="bg-blue-100 p-4 rounded-full mb-4"><CheckCircle2 className="text-blue-600" size={36} /></div>
          <h3 className="text-lg font-bold text-gray-800">資料庫連線狀態</h3>
          <p className="text-gray-600 mt-1">{isFirebaseReady ? '團隊已連線共備中 🟢' : '目前為本地預覽模式 🟡'}</p>
          <div className="mt-4 pt-4 border-t border-gray-100 w-full">
             <p className="text-sm text-gray-500">目前發言身分：<strong className="text-blue-700 block mt-1 text-base">{userName}</strong></p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center border-b pb-3"><Clock className="mr-2 text-gray-500" size={20} />各項指標撰寫進度概覽</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
          {INDICATORS.map(ind => {
            const total = ind.subItems.length;
            const filled = ind.subItems.filter(sub => texts[sub.id] && texts[sub.id].trim().length > 0).length;
            const percent = Math.round((filled / total) * 100);
            return (
              <div key={ind.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-gray-700 truncate mr-4" title={ind.title}>{ind.title}</span>
                  <span className="text-gray-500 font-mono">{filled}/{total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full transition-all duration-500 relative" style={{ width: `${percent}%` }}>
                    {percent > 0 && <span className="absolute right-1 top-0 text-[10px] text-white font-bold leading-3">{percent}%</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );

  const renderResources = () => {
    const linkResources = resources.filter(res => res.type === 'link');
    const driveFolderId = extractDriveId(sharedDriveLink);

    return (
      <div className="animate-fade-in w-full max-w-7xl mx-auto flex flex-col pb-8 space-y-6">
        
        {/* === 新增：內嵌 Google Drive 區塊 === */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-blue-50/80 px-5 py-3 border-b border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 z-10">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="font-bold text-blue-900 flex items-center text-lg">
                <Cloud className="mr-2 text-blue-600" size={22} /> 🏫 團隊共用 Google 雲端硬碟
              </h3>
              {driveFolderId && (
                <a href={sharedDriveLink} target="_blank" rel="noopener noreferrer" className="ml-0 sm:ml-2 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition flex items-center text-sm font-bold border border-blue-300 bg-white shadow-sm hover:shadow">
                  <ExternalLink size={16} className="mr-1.5" /> 開啟雲端硬碟上傳
                </a>
              )}
            </div>
            
            {/* 編輯網址按鈕 */}
            {!isEditingDriveLink ? (
              <button onClick={() => { setTempDriveLink(sharedDriveLink); setIsEditingDriveLink(true); }} className="text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition flex items-center text-sm font-medium border border-blue-200 bg-white shadow-sm">
                <Pencil size={14} className="mr-1.5" /> 綁定/修改雲端網址
              </button>
            ) : (
              <div className="flex space-x-2">
                <button onClick={() => setIsEditingDriveLink(false)} className="text-gray-500 hover:bg-gray-200 px-2 py-1.5 rounded-lg transition"><X size={16} /></button>
                <button onClick={handleSaveDriveLink} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition flex items-center text-sm font-bold shadow-sm">儲存設定</button>
              </div>
            )}
          </div>

          {/* 編輯輸入區 */}
          {isEditingDriveLink && (
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row items-center gap-3">
              <input 
                type="url" 
                placeholder="請貼上您 Google 雲端硬碟資料夾的「共用連結」..." 
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 flex-1 w-full bg-white"
                value={tempDriveLink}
                onChange={(e) => setTempDriveLink(e.target.value)}
              />
              <span className="text-xs text-gray-500 w-full md:w-auto">⚠️ 記得將資料夾權限設為「知道連結的人皆可查看」</span>
            </div>
          )}

          {/* 內嵌 iframe 顯示區 */}
          <div className="w-full bg-slate-100 flex-shrink-0" style={{ height: '450px' }}>
            {driveFolderId ? (
              <iframe 
                src={`https://drive.google.com/embeddedfolderview?id=${driveFolderId}#list`} 
                width="100%" 
                height="100%" 
                frameBorder="0"
                title="Google Drive 團隊空間"
                className="w-full h-full"
              ></iframe>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Cloud size={64} className="text-gray-300 mb-4" />
                <p className="text-lg font-bold text-gray-600">尚未綁定團隊雲端硬碟</p>
                <p className="text-sm mt-2">請點擊右上角按鈕，貼上您的 Google Drive 資料夾分享連結</p>
              </div>
            )}
          </div>
          {driveFolderId && (
            <div className="bg-gray-50 p-3 text-center border-t border-gray-200">
              <p className="text-sm text-gray-600 flex items-center justify-center font-medium">
                💡 若需上傳新檔案，請點擊上方的「<ExternalLink size={16} className="mx-1 text-blue-600"/>開啟雲端硬碟上傳」按鈕。
              </p>
            </div>
          )}
        </div>

        {/* 下方：個別網址推薦區 (輔助用) */}
        <div className="mb-6 bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex-shrink-0">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center text-base">
            <LinkIcon className="mr-2 text-green-600" size={18} /> 推薦外部參考網頁 / 單一文件連結
          </h3>
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 mb-5">
            <input 
              type="text" 
              placeholder="資源標題 (例如：114年獲獎範本)" 
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 w-full md:w-1/3 bg-gray-50"
              value={resourceUrlTitle}
              onChange={(e) => setResourceUrlTitle(e.target.value)}
            />
            <input 
              type="url" 
              placeholder="貼上網址 (https://...)" 
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 flex-1 bg-gray-50"
              value={resourceUrl}
              onChange={(e) => setResourceUrl(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') handleAddUrl(); }}
            />
            <button 
              onClick={handleAddUrl}
              disabled={!resourceUrl.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition flex items-center justify-center font-bold disabled:opacity-50 flex-shrink-0"
            >
              <Plus size={18} className="mr-1" /> 分享網頁
            </button>
          </div>

          <div className="border border-gray-100 rounded-lg h-60 overflow-y-auto bg-gray-50 p-4">
             <h4 className="text-sm font-bold text-gray-600 mb-3 px-1 border-b border-gray-200 pb-2">夥伴推薦網址：</h4>
             {linkResources.length === 0 ? (
               <div className="text-center text-gray-400 text-sm mt-12">尚無推薦網址</div>
             ) : (
               <ul className="space-y-2">
                {linkResources.map(res => {
                  const isMe = res.uploader === userName;
                  return (
                  <li key={res.id} className="flex items-center justify-between text-sm p-2.5 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition">
                    <div className="flex items-center truncate mr-2 flex-1">
                      <LinkIcon className="text-blue-500 mr-2 flex-shrink-0" size={16} />
                      <a href={res.link} target="_blank" rel="noopener noreferrer" className="truncate text-blue-700 hover:underline font-medium text-base">{res.name}</a>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{res.uploader} 推薦</span>
                      {isMe && (
                        <button
                          onClick={() => handleDeleteResource(res.id)}
                          className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                          title="刪除此連結"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </li>
                )})}
              </ul>
             )}
          </div>
        </div>

      </div>
    );
  };

  const renderWorkspace = () => (
    <div className="animate-fade-in flex flex-col w-full max-w-7xl mx-auto pb-10">
      <div className="space-y-8">
        {INDICATORS.map(indicator => (
          <div key={indicator.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-slate-800 px-5 py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
              <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">{indicator.title}</h3>
            </div>
            <div className="p-3 sm:p-6 space-y-8 bg-slate-50">
              {indicator.subItems.map(sub => {
                const isEditingHint = editingHintId === sub.id;
                const activeHint = customHints[sub.id] !== undefined ? customHints[sub.id] : sub.defaultHint;
                const hasHint = activeHint && activeHint.trim().length > 0;

                return (
                  <div key={sub.id} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col transition hover:shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                      <label className="font-bold text-gray-800 text-lg flex-1 leading-snug">{sub.title}</label>
                      <div className="flex items-center space-x-2 self-end md:self-auto flex-shrink-0">
                        {texts[sub.id] && <span className="text-xs text-green-700 bg-green-100 px-2 py-1.5 rounded flex items-center font-bold"><CheckCircle2 size={14} className="mr-1" /> 已有草稿</span>}
                        <button onClick={() => handleSaveText(sub.id, texts[sub.id])} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-1.5 rounded-md shadow transition-colors flex items-center text-sm font-medium"><Save size={16} className="mr-1.5" /> 儲存</button>
                      </div>
                    </div>
                    <div className={`mb-5 rounded-lg border overflow-hidden ${hasHint || isEditingHint ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex justify-between items-center px-4 py-2 border-b border-opacity-30 border-black bg-black/5">
                         <span className="text-sm font-bold text-gray-700 flex items-center"><AlertCircle size={16} className="mr-1.5 text-amber-600" /> 撰寫重點提示 (點擊編修)</span>
                         {!isEditingHint ? (
                            <button onClick={() => { setTempHintContent(activeHint || ''); setEditingHintId(sub.id); }} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded text-xs font-medium flex items-center transition"><Pencil size={14} className="mr-1" /> 編輯提示</button>
                         ) : (
                            <div className="flex space-x-2">
                              <button onClick={() => setEditingHintId(null)} className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 text-xs px-2 py-1 rounded transition">取消</button>
                              <button onClick={() => handleSaveHint(sub.id)} className="bg-blue-600 hover:bg-blue-700 text-white rounded text-xs px-3 py-1 font-medium shadow-sm transition">儲存</button>
                            </div>
                         )}
                      </div>
                      <div className="p-4 text-gray-700 text-sm md:text-base">
                        {isEditingHint ? (
                          <textarea className="w-full h-28 p-3 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={tempHintContent} onChange={(e) => setTempHintContent(e.target.value)} placeholder="請為團隊留下這項指標的撰寫重點或委員建議..." />
                        ) : (
                          <div className="whitespace-pre-wrap leading-relaxed font-medium text-amber-900">{activeHint || <span className="text-gray-400 italic font-normal">尚無提示，可點擊上方按鈕新增。</span>}</div>
                        )}
                      </div>
                    </div>
                    <div className="relative flex-1 flex flex-col min-h-[350px]">
                      <textarea
                        className="w-full flex-1 p-5 pb-20 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y text-gray-800 text-base leading-relaxed bg-white shadow-inner"
                        placeholder="請在此輸入共筆文本內容... (建議邊寫邊點擊右上角或右下角儲存)"
                        value={texts[sub.id] || ''}
                        onChange={(e) => setTexts(prev => ({...prev, [sub.id]: e.target.value}))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDiscussion = () => {
    return (
      <div className="h-full flex flex-col animate-fade-in w-full max-w-5xl mx-auto pb-6">
        <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden shadow-sm min-h-[60vh]">
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 h-full flex flex-col items-center justify-center">
                <MessageSquare size={56} className="mb-4 text-gray-200" />
                <p className="text-lg">尚無留言</p>
                <p className="text-sm mt-1">趕快來打個招呼或分享靈感吧！</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.author === userName;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center space-x-2 mb-1 px-1">
                      <span className="text-xs font-bold text-gray-500">{msg.author}</span>
                      {isMe && (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)} 
                          className="text-[11px] text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded transition-colors flex items-center"
                          title="收回此留言"
                        >
                          <Trash2 size={12} className="mr-0.5" /> 收回
                        </button>
                      )}
                    </div>
                    <div className={`px-5 py-3 rounded-2xl max-w-[85%] whitespace-pre-wrap shadow-sm text-[15px] leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <div className="p-4 bg-white border-t border-gray-100 flex items-center space-x-3">
            <input 
              type="text" 
              className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-base bg-gray-50"
              placeholder={`以 ${userName} 的身分發言... (按 Enter 送出)`}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') handleSendMessage(inputMsg); }}
            />
            <button onClick={() => { handleSendMessage(inputMsg); setInputMsg(''); }} disabled={!inputMsg.trim()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full shadow-md transition-colors flex-shrink-0 disabled:opacity-50 font-bold">送出</button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600 font-bold text-xl">系統初始化中...</div>;

  return (
    <div className="h-screen w-full bg-slate-100 flex flex-col font-sans text-gray-800 overflow-hidden">
      <header className="bg-slate-900 text-white shadow-md z-30 flex-shrink-0 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center flex-shrink-0 mr-4">
              <div className="bg-blue-600 text-white rounded-lg flex items-center justify-center font-black w-10 h-10 shadow-inner mr-3 border border-blue-500">115</div>
              <div className="hidden sm:block">
                 <h1 className="font-bold text-lg tracking-wide leading-tight">閱磐比賽共備平台</h1>
                 <p className="text-[10px] text-blue-300 font-medium">南興國小團隊專用</p>
              </div>
            </div>
            <nav className="flex-1 flex justify-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
              {[{ id: 'dashboard', icon: LayoutDashboard, label: '戰情室' }, { id: 'resources', icon: FolderOpen, label: '資源智庫' }, { id: 'workspace', icon: Edit3, label: '指標共筆' }, { id: 'discussion', icon: MessageSquare, label: '討論交流' }].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all flex-shrink-0 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <tab.icon size={18} className="mr-1.5" />
                  <span className={activeTab === tab.id ? 'block' : 'hidden md:block'}>{tab.label}</span>
                </button>
              ))}
            </nav>
            <div className="flex items-center flex-shrink-0 ml-4">
              <button onClick={() => setShowSettings(true)} className="flex items-center bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg transition border border-slate-700 text-sm font-medium">
                <User size={16} className="sm:mr-2" />
                <span className="hidden sm:inline max-w-[100px] truncate">{userName}</span>
                <Settings size={14} className="ml-2 opacity-50 hidden sm:block" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'resources' && renderResources()}
        {activeTab === 'workspace' && renderWorkspace()}
        {activeTab === 'discussion' && renderDiscussion()}
      </main>

      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in relative border border-gray-100">
            <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center"><Settings className="mr-2 text-blue-600"/> 個人設定</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm transition"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                 <label className="text-sm text-gray-700 font-bold mb-1.5 block flex items-center"><User size={16} className="mr-1 text-gray-400"/> 您的身分/稱呼</label>
                 <input type="text" value={userName} onChange={handleUpdateName} className="w-full bg-white text-gray-800 text-base rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition shadow-sm" placeholder="例如：校長、教務主任" />
                 <p className="text-xs text-gray-500 mt-1.5 ml-1">留言與存檔時將顯示此名稱。</p>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
               <button onClick={() => setShowSettings(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors w-full sm:w-auto">完成設定</button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}