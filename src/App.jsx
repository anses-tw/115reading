import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, FolderOpen, Edit3, MessageSquare, AlertCircle, Save, Upload, FileText, CheckCircle2, Clock, Send, Paperclip, Sparkles, Wand2, Link as LinkIcon, Plus, Pencil, X, User, Settings } from 'lucide-react';

// --- Firebase Initialization (Follows Strict Rules) ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';

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
  // 請自行取一個專屬的 App ID，例如學校縮寫
  appId = 'nsps-reading-115'; 
  isFirebaseReady = true;
} catch (error) {
  console.error("Firebase initialization failed:", error);
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

// --- Main Application Component ---
export default function App() {
  // UI & Layout States
  const [activeTab, setActiveTab] = useState('workspace'); 
  const [showSettings, setShowSettings] = useState(false); // Controls the settings modal
  
  // User & Settings States
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(localStorage.getItem('user_name') || '未命名夥伴');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  
  // Data States
  const [texts, setTexts] = useState({});
  const [messages, setMessages] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dynamic Content States (Editable by Principal/Committee)
  const [dashboardNote, setDashboardNote] = useState(DEFAULT_DASHBOARD_NOTE);
  const [customHints, setCustomHints] = useState({});
  
  // Editing States
  const [isEditingDashboardNote, setIsEditingDashboardNote] = useState(false);
  const [tempDashboardNote, setTempDashboardNote] = useState('');
  const [editingHintId, setEditingHintId] = useState(null);
  const [tempHintContent, setTempHintContent] = useState('');
  
  // Interactive States
  const [inputMsg, setInputMsg] = useState(''); 
  const [isGenerating, setIsGenerating] = useState(null); 
  const [aiError, setAiError] = useState(null); 
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

    // 1. Fetch Co-edited Texts
    const textsRef = collection(db, 'artifacts', appId, 'public', 'data', 'co_edit_texts');
    const unsubTexts = onSnapshot(textsRef, (snapshot) => {
      const newTexts = {};
      snapshot.forEach(doc => { newTexts[doc.id] = doc.data().content; });
      setTexts(newTexts);
    }, (err) => console.error(err));

    // 2. Fetch Messages
    const msgsRef = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    const unsubMsgs = onSnapshot(msgsRef, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      setMessages(msgs);
    }, (err) => console.error(err));

    // 3. Fetch Resources
    const resRef = collection(db, 'artifacts', appId, 'public', 'data', 'resources');
    const unsubRes = onSnapshot(resRef, (snapshot) => {
      const res = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.sort((a, b) => (b.uploadedAt?.toMillis() || 0) - (a.uploadedAt?.toMillis() || 0));
      setResources(res);
    }, (err) => console.error(err));

    // 4. Fetch Editable Dashboard Note
    const settingsRef = collection(db, 'artifacts', appId, 'public', 'data', 'platform_settings');
    const unsubSettings = onSnapshot(settingsRef, (snapshot) => {
      snapshot.forEach(doc => {
        if(doc.id === 'dashboard_note' && doc.data().content !== undefined) {
          setDashboardNote(doc.data().content);
        }
      });
    }, (err) => console.error(err));

    // 5. Fetch Editable Indicator Hints
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

  // --- Handlers: Settings & Names ---
  const handleUpdateName = (e) => {
    setUserName(e.target.value);
    localStorage.setItem('user_name', e.target.value);
  };
  const handleUpdateGeminiKey = (e) => {
    setGeminiKey(e.target.value);
    localStorage.setItem('gemini_api_key', e.target.value);
  };

  // --- Handlers: Editable Content (Hints & Notes) ---
  const handleSaveDashboardNote = async () => {
    if (!user || !isFirebaseReady) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'platform_settings', 'dashboard_note');
      await setDoc(docRef, { content: tempDashboardNote, lastUpdatedBy: userName, updatedAt: serverTimestamp() }, { merge: true });
      setIsEditingDashboardNote(false);
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

  // --- Handlers: Data Actions ---
  const handleSaveText = async (indicatorId, content) => {
    if (!user || !isFirebaseReady) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'co_edit_texts', indicatorId);
      await setDoc(docRef, {
        content: content,
        lastUpdatedBy: userName,
        lastUpdatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleSendMessage = async (text) => {
    if (!user || !isFirebaseReady || !text.trim()) return;
    try {
      const msgsRef = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
      await addDoc(msgsRef, {
        text: text,
        author: userName, 
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Message error:", err);
    }
  };

  const handleUploadMock = async (e) => {
    if (!user || !isFirebaseReady || !e.target.files[0]) return;
    const file = e.target.files[0];
    try {
      const resRef = collection(db, 'artifacts', appId, 'public', 'data', 'resources');
      await addDoc(resRef, {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        uploader: userName,
        uploadedAt: serverTimestamp()
      });
      e.target.value = null; 
    } catch (err) {
      console.error("Upload error:", err);
    }
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
    } catch (err) {
      console.error("Add URL error:", err);
    }
  };

  // --- Gemini API Integration ---
  const callGeminiWithBackoff = async (prompt, maxRetries = 5) => {
    const activeKey = geminiKey.trim();
    if (!activeKey) throw new Error("請先在右上角【個人設定】中填寫您的 Gemini API Key！");
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${activeKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    const delays = [1000, 2000, 4000, 8000, 16000];

    for (let i = 0; i <= maxRetries; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "AI 沒有回傳內容。";
      } catch (error) {
        if (i === maxRetries) throw new Error("AI 伺服器連線失敗或 API Key 無效。");
        await new Promise(res => setTimeout(res, delays[i]));
      }
    }
  };

  const handleAIPolish = async (sub) => {
    const currentText = texts[sub.id] || "";
    if (!currentText.trim()) {
      setAiError("請先輸入一些草稿內容，AI 才能協助潤飾喔！");
      setTimeout(() => setAiError(null), 3000);
      return;
    }
    setIsGenerating(sub.id);
    try {
      const prompt = `你是一位資深的台灣教育專家，專門協助學校撰寫「閱讀磐石獎」的參賽方案。請將以下教師撰寫的草稿，潤飾成正式、專業、具備學術感與教育熱忱的文本段落。
請保持原本的事實與重點，但優化文句的流暢度與結構。
文本段落所屬指標：${sub.title}
原有草稿：\n${currentText}`;
      const aiResponse = await callGeminiWithBackoff(prompt);
      setTexts(prev => ({ ...prev, [sub.id]: prev[sub.id] + '\n\n【✨ AI 潤飾建議】：\n' + aiResponse }));
    } catch (error) {
      setAiError(error.message);
      setTimeout(() => setAiError(null), 4000);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleAIBrainstorm = async (sub) => {
    setIsGenerating(sub.id);
    try {
      const currentText = texts[sub.id] || "目前尚無內容。";
      const hint = customHints[sub.id] !== undefined ? customHints[sub.id] : (sub.defaultHint || "無");
      const prompt = `你是一位熟悉台灣國小「閱讀磐石獎」評選標準的顧問。我們正在撰寫參賽方案的以下指標：
指標名稱：${sub.title}
委員或校長給的撰寫重點提示：${hint}
我們目前的草稿內容：\n${currentText}
\n請根據以上資訊，提供 3 個可以進一步延伸、補充或優化的「具體亮點行動方案」或「撰寫靈感」。請簡明扼要，以條列式呈現，幫助團隊激發靈感。`;
      const aiResponse = await callGeminiWithBackoff(prompt);
      setTexts(prev => ({ ...prev, [sub.id]: (prev[sub.id] || '') + '\n\n【✨ AI 靈感建議】：\n' + aiResponse }));
    } catch (error) {
      setAiError(error.message);
      setTimeout(() => setAiError(null), 4000);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleAskAIAdvisor = async () => {
    if (!user || !isFirebaseReady || !inputMsg.trim()) return;
    const userMsg = inputMsg;
    setInputMsg(''); 
    
    try {
      const msgsRef = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
      await addDoc(msgsRef, { text: userMsg, author: userName, createdAt: serverTimestamp() });
      
      const prompt = `你是一位閱讀磐石獎的輔導顧問。請用友善、專業、鼓勵的語氣回答團隊成員的以下問題或留言。你回答時不需要自稱 AI，可以自稱「閱磐顧問」：\n\n團隊成員留言：${userMsg}`;
      const aiResponse = await callGeminiWithBackoff(prompt);
      
      await addDoc(msgsRef, { text: aiResponse, author: "✨顧問", createdAt: serverTimestamp() });
    } catch (err) {
      console.error(err);
      setAiError(err.message || "呼叫 AI 顧問失敗");
      setTimeout(() => setAiError(null), 4000);
    }
  };

  // --- Render Functions ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editable Sticky Notes */}
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
                <button onClick={() => setIsEditingDashboardNote(false)} className="text-gray-500 hover:bg-gray-100 p-1.5 rounded transition">
                  <X size={16} />
                </button>
                <button onClick={handleSaveDashboardNote} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded transition flex items-center text-sm font-medium">
                  <Save size={14} className="mr-1" /> 儲存
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            {isEditingDashboardNote ? (
              <textarea
                className="w-full h-full min-h-[150px] p-3 border border-amber-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={tempDashboardNote}
                onChange={(e) => setTempDashboardNote(e.target.value)}
                placeholder="請輸入給團隊的重要提醒..."
              />
            ) : (
              <div className="text-amber-900 whitespace-pre-wrap leading-relaxed">
                {dashboardNote}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats / Info */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <CheckCircle2 className="text-blue-600" size={36} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">資料庫連線狀態</h3>
          <p className="text-gray-600 mt-1">
             {isFirebaseReady ? '團隊已連線共備中 🟢' : '目前為本地預覽模式 🟡'}
          </p>
          <div className="mt-4 pt-4 border-t border-gray-100 w-full">
             <p className="text-sm text-gray-500">
               目前發言身分：<strong className="text-blue-700 block mt-1 text-base">{userName}</strong>
             </p>
          </div>
        </div>
      </div>

      {/* Progress Trackers */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center border-b pb-3">
          <Clock className="mr-2 text-gray-500" size={20} />
          各項指標撰寫進度概覽
        </h3>
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
    // 將資源分類為「網頁」與「檔案」
    const linkResources = resources.filter(res => res.type === 'link');
    const fileResources = resources.filter(res => res.type !== 'link');
    const defaultFiles = ['111教卓文本.pdf', '114方案全文.pdf', '閱磐比賽審查指標.pdf', '閱磐討論會議紀錄1150429.docx'];

    return (
      <div className="animate-fade-in w-full max-w-7xl mx-auto flex flex-col min-h-[80vh] pb-8">
        {/* 上方：資源列表展示區 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          
          {/* 左欄：參考資料檔案列表 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[55vh] lg:h-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 z-10">
              <h3 className="font-bold text-gray-800 flex items-center text-lg">
                <Paperclip className="mr-2 text-green-600" size={20} /> 參考資料檔案列表
              </h3>
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                共 {defaultFiles.length + fileResources.length} 份
              </span>
            </div>
            <div className="p-2 flex-1 overflow-y-auto bg-white">
              <ul className="space-y-2">
                {/* 預設校內資料 */}
                {defaultFiles.map(name => (
                  <li key={name} className="flex items-center text-sm p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 cursor-pointer transition">
                    <FileText className="text-yellow-500 mr-3 flex-shrink-0" size={20} />
                    <span className="flex-1 font-medium text-gray-700">{name}</span>
                    <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-2 flex-shrink-0">預設</span>
                  </li>
                ))}
                {/* 團隊上傳檔案 */}
                {fileResources.map(res => (
                  <li key={res.id} className="flex items-center justify-between text-sm p-3 bg-green-50/30 hover:bg-green-50 rounded-lg border border-green-100 transition-colors">
                    <div className="flex items-center truncate mr-3">
                      <Paperclip className="text-green-500 mr-3 flex-shrink-0" size={18} />
                      <span className="truncate font-medium text-gray-800" title={res.name}>{res.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0 bg-white px-2 py-1 rounded border border-green-200 shadow-sm">
                      {res.size} • {res.uploader}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 右欄：參考網頁列表 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[55vh] lg:h-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 z-10">
              <h3 className="font-bold text-gray-800 flex items-center text-lg">
                <LinkIcon className="mr-2 text-blue-600" size={20} /> 參考網頁列表
              </h3>
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                共 {linkResources.length} 筆
              </span>
            </div>
            <div className="p-2 flex-1 overflow-y-auto bg-white">
              {linkResources.length === 0 ? (
                <div className="text-center text-gray-400 h-full flex flex-col items-center justify-center">
                   <LinkIcon size={48} className="mb-4 text-blue-100" />
                   尚無參考網頁，請使用下方功能新增。
                </div>
              ) : (
                <ul className="space-y-2">
                  {linkResources.map(res => (
                    <li key={res.id} className="flex items-center justify-between text-sm p-3 bg-blue-50/50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors">
                      <div className="flex items-center truncate mr-3">
                        <LinkIcon className="text-blue-500 mr-3 flex-shrink-0" size={18} />
                        <a href={res.link} target="_blank" rel="noopener noreferrer" className="truncate text-blue-700 hover:underline font-bold" title={res.name}>{res.name}</a>
                      </div>
                      <div className="text-xs text-blue-600 whitespace-nowrap flex-shrink-0 bg-white px-2 py-1 rounded border border-blue-200 shadow-sm font-medium">
                        {res.uploader} 推薦
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* 下方：新增資源操作區 */}
        <div className="mt-8 bg-white p-6 rounded-xl shadow-md border border-gray-200 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 bg-blue-500 h-full"></div>
          <h3 className="font-bold text-gray-800 mb-5 flex items-center text-lg">
            <Plus size={20} className="mr-2 text-blue-600" /> 新增參考資源
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 新增參考網頁 */}
            <div className="flex flex-col space-y-3">
              <span className="text-sm font-bold text-gray-700 flex items-center">
                 <LinkIcon size={16} className="mr-1.5 text-blue-500"/> 新增參考網頁
              </span>
              <div className="flex flex-col xl:flex-row space-y-3 xl:space-y-0 xl:space-x-3">
                <input 
                  type="text" 
                  placeholder="網址標題 (如：獲獎名單)" 
                  className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 flex-1 bg-gray-50 transition"
                  value={resourceUrlTitle}
                  onChange={(e) => setResourceUrlTitle(e.target.value)}
                />
                <input 
                  type="url" 
                  placeholder="貼上網址 (https://...)" 
                  className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 flex-1 bg-gray-50 transition"
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter') handleAddUrl(); }}
                />
                <button 
                  onClick={handleAddUrl}
                  disabled={!resourceUrl.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition flex items-center justify-center font-bold disabled:opacity-50 flex-shrink-0"
                >
                  新增網頁
                </button>
              </div>
            </div>

            {/* 新增參考檔案 */}
            <div className="flex flex-col space-y-3">
              <span className="text-sm font-bold text-gray-700 flex items-center">
                 <Paperclip size={16} className="mr-1.5 text-green-500"/> 新增參考檔案
              </span>
              <div className="flex items-center h-full pb-1">
                <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg shadow-sm transition flex items-center font-bold justify-center w-full sm:w-auto">
                  <Upload size={18} className="mr-2" />
                  選擇檔案並上傳
                  <input type="file" className="hidden" onChange={handleUploadMock} />
                </label>
                <span className="text-xs text-gray-500 ml-4 hidden sm:inline-block">支援 PDF, Word, PPT 等格式</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWorkspace = () => (
    <div className="animate-fade-in flex flex-col w-full max-w-7xl mx-auto pb-10">
      {aiError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center shadow-sm text-sm font-medium animate-pulse mb-4">
          <AlertCircle size={18} className="mr-2" /> {aiError}
        </div>
      )}
      
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
                    
                    {/* Header & Editing Status */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                      <label className="font-bold text-gray-800 text-lg flex-1 leading-snug">
                        {sub.title}
                      </label>
                      <div className="flex items-center space-x-2 self-end md:self-auto flex-shrink-0">
                        {texts[sub.id] && (
                          <span className="text-xs text-green-700 bg-green-100 px-2 py-1.5 rounded flex items-center font-bold">
                            <CheckCircle2 size={14} className="mr-1" /> 已有草稿
                          </span>
                        )}
                        <button 
                          onClick={() => handleSaveText(sub.id, texts[sub.id])}
                          disabled={isGenerating === sub.id}
                          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-1.5 rounded-md shadow transition-colors flex items-center text-sm font-medium disabled:opacity-50"
                        >
                          <Save size={16} className="mr-1.5" /> 儲存
                        </button>
                      </div>
                    </div>
                    
                    {/* Editable Hint Box */}
                    <div className={`mb-5 rounded-lg border overflow-hidden ${hasHint || isEditingHint ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex justify-between items-center px-4 py-2 border-b border-opacity-30 border-black bg-black/5">
                         <span className="text-sm font-bold text-gray-700 flex items-center">
                            <AlertCircle size={16} className="mr-1.5 text-amber-600" /> 撰寫重點提示 (點擊編修)
                         </span>
                         {!isEditingHint ? (
                            <button onClick={() => { setTempHintContent(activeHint || ''); setEditingHintId(sub.id); }} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded text-xs font-medium flex items-center transition">
                              <Pencil size={14} className="mr-1" /> 編輯提示
                            </button>
                         ) : (
                            <div className="flex space-x-2">
                              <button onClick={() => setEditingHintId(null)} className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 text-xs px-2 py-1 rounded transition">取消</button>
                              <button onClick={() => handleSaveHint(sub.id)} className="bg-blue-600 hover:bg-blue-700 text-white rounded text-xs px-3 py-1 font-medium shadow-sm transition">儲存</button>
                            </div>
                         )}
                      </div>
                      
                      <div className="p-4 text-gray-700 text-sm md:text-base">
                        {isEditingHint ? (
                          <textarea 
                            className="w-full h-28 p-3 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={tempHintContent}
                            onChange={(e) => setTempHintContent(e.target.value)}
                            placeholder="請為團隊留下這項指標的撰寫重點或委員建議..."
                          />
                        ) : (
                          <div className="whitespace-pre-wrap leading-relaxed font-medium text-amber-900">
                            {activeHint || <span className="text-gray-400 italic font-normal">尚無提示，可點擊上方按鈕新增。</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Main Workspace Textarea */}
                    <div className="relative flex-1 flex flex-col min-h-[350px]">
                      <textarea
                        className="w-full flex-1 p-5 pb-20 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y text-gray-800 text-base leading-relaxed bg-white shadow-inner"
                        placeholder="請在此輸入共筆文本內容... (建議邊寫邊點擊右上角或右下角儲存)"
                        value={texts[sub.id] || ''}
                        onChange={(e) => setTexts(prev => ({...prev, [sub.id]: e.target.value}))}
                        disabled={isGenerating === sub.id}
                      />
                      
                      {isGenerating === sub.id && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg backdrop-blur-sm z-10 border border-blue-200">
                          <div className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                            <Sparkles className="animate-spin text-blue-600 mb-3" size={36} />
                            <span className="text-blue-800 font-bold text-lg">AI 思考與生成中...</span>
                            <span className="text-sm text-gray-500 mt-1">這可能需要幾秒鐘的時間</span>
                          </div>
                        </div>
                      )}

                      {/* AI Tool Buttons */}
                      <div className="absolute bottom-4 left-4 right-4 flex justify-end space-x-3 z-20">
                        <button 
                          onClick={() => handleAIBrainstorm(sub)}
                          disabled={isGenerating === sub.id}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center text-sm font-bold border border-purple-200 disabled:opacity-50"
                          title="根據提示與現有草稿，請 AI 提供 3 個亮點建議"
                        >
                          <Wand2 size={18} className="mr-2" /> 💡 激發靈感
                        </button>
                        <button 
                          onClick={() => handleAIPolish(sub)}
                          disabled={isGenerating === sub.id}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center text-sm font-bold border border-blue-200 disabled:opacity-50"
                          title="請 AI 將現有草稿潤飾為專業競賽語氣"
                        >
                          <Sparkles size={18} className="mr-2" /> ✨ 專業潤飾
                        </button>
                      </div>
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
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4 flex-shrink-0">
          <p className="text-sm text-blue-800 font-medium flex items-center">
             <MessageSquare className="mr-2" /> 隨時發布一閃而過的靈感，或標註夥伴詢問資料。若有評分或架構上的疑問，可呼叫「AI 顧問」為您解答。
          </p>
        </div>
        
        <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden shadow-sm min-h-[60vh]">
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 h-full flex flex-col items-center justify-center">
                <MessageSquare size={56} className="mb-4 text-gray-200" />
                <p className="text-lg">尚無留言</p>
                <p className="text-sm mt-1">趕快來打個招呼或分享靈感吧！</p>
              </div>
            ) : (
              messages.map(msg => {
                const isAI = msg.author === "✨顧問";
                const isMe = msg.author === userName;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className={`text-xs font-bold mb-1 px-1 ${isAI ? 'text-purple-600' : 'text-gray-500'}`}>
                      {msg.author}
                    </span>
                    <div className={`px-5 py-3 rounded-2xl max-w-[85%] whitespace-pre-wrap shadow-sm text-[15px] leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-br-none' : isAI ? 'bg-purple-50 border border-purple-200 text-purple-900 rounded-bl-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                )
              })
            )}
          </div>
          
          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 flex items-center space-x-3">
            <input 
              type="text" 
              className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-base bg-gray-50"
              placeholder={`以 ${userName} 的身分發言... (按 Enter 送出)`}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') handleSendMessage(inputMsg); }}
            />
            <button 
              onClick={() => handleAskAIAdvisor()}
              disabled={!inputMsg.trim()}
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-3 rounded-full transition-colors flex-shrink-0 flex items-center text-sm font-bold border border-purple-200 disabled:opacity-50"
              title="向 AI 顧問提問"
            >
              <Sparkles size={18} className="mr-1.5" /> AI 顧問
            </button>
            <button 
              onClick={() => { handleSendMessage(inputMsg); setInputMsg(''); }}
              disabled={!inputMsg.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full shadow-md transition-colors flex-shrink-0 disabled:opacity-50 font-bold"
            >
              送出
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600 font-bold text-xl"><Sparkles className="animate-pulse mr-2"/> 系統初始化中...</div>;
  }

  return (
    <div className="h-screen w-full bg-slate-100 flex flex-col font-sans text-gray-800 overflow-hidden">
      
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 text-white shadow-md z-30 flex-shrink-0 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo / Title Area */}
            <div className="flex items-center flex-shrink-0 mr-4">
              <div className="bg-blue-600 text-white rounded-lg flex items-center justify-center font-black w-10 h-10 shadow-inner mr-3 border border-blue-500">
                115
              </div>
              <div className="hidden sm:block">
                 <h1 className="font-bold text-lg tracking-wide leading-tight">閱磐比賽共備平台</h1>
                 <p className="text-[10px] text-blue-300 font-medium">南興國小團隊專用</p>
              </div>
            </div>
            
            {/* Nav Tabs (Centered) */}
            <nav className="flex-1 flex justify-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'dashboard', icon: LayoutDashboard, label: '戰情室' },
                { id: 'resources', icon: FolderOpen, label: '資源智庫' },
                { id: 'workspace', icon: Edit3, label: '指標共筆' },
                { id: 'discussion', icon: MessageSquare, label: '討論交流' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)} 
                  className={`flex items-center px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all flex-shrink-0 ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <tab.icon size={18} className="mr-1.5" />
                  <span className={activeTab === tab.id ? 'block' : 'hidden md:block'}>{tab.label}</span>
                </button>
              ))}
            </nav>
            
            {/* User Settings Button (Right) */}
            <div className="flex items-center flex-shrink-0 ml-4">
              <button 
                onClick={() => setShowSettings(true)}
                className="flex items-center bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg transition border border-slate-700 text-sm font-medium"
              >
                <User size={16} className="sm:mr-2" />
                <span className="hidden sm:inline max-w-[100px] truncate">{userName}</span>
                <Settings size={14} className="ml-2 opacity-50 hidden sm:block" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Dynamic Content Container */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'resources' && renderResources()}
        {activeTab === 'workspace' && renderWorkspace()}
        {activeTab === 'discussion' && renderDiscussion()}
      </main>

      {/* Settings Modal (Overlay) */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in relative border border-gray-100">
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Settings className="mr-2 text-blue-600"/> 個人與系統設定
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm transition">
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                 <label className="text-sm text-gray-700 font-bold mb-1.5 block flex items-center">
                   <User size={16} className="mr-1 text-gray-400"/> 您的身分/稱呼
                 </label>
                 <input 
                   type="text" 
                   value={userName}
                   onChange={handleUpdateName}
                   className="w-full bg-white text-gray-800 text-base rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition shadow-sm"
                   placeholder="例如：校長、教務主任"
                 />
                 <p className="text-xs text-gray-500 mt-1.5 ml-1">留言與存檔時將顯示此名稱。</p>
              </div>
              
              <div className="pt-2">
                 <label className="text-sm text-gray-700 font-bold mb-1.5 block flex items-center">
                   <Sparkles size={16} className="mr-1 text-purple-500"/> Gemini API 金鑰 (選填)
                 </label>
                 <input 
                   type="password" 
                   value={geminiKey}
                   onChange={handleUpdateGeminiKey}
                   className="w-full bg-white text-gray-800 text-base rounded-lg border border-gray-300 p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition shadow-sm font-mono"
                   placeholder="貼上您的 API Key 以啟用 AI 助理"
                 />
                 <div className="bg-blue-50 p-3 rounded-md mt-3 border border-blue-100">
                    <p className="text-xs text-blue-800 leading-relaxed font-medium">
                      🔒 安全提示：您的 API 金鑰僅會安全地存放在您目前的「瀏覽器本地端 (LocalStorage)」中，不會上傳或儲存至本平台的共備資料庫。
                    </p>
                 </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
               <button onClick={() => setShowSettings(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors w-full sm:w-auto">
                 完成設定
               </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Global CSS for scrollbars */}
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