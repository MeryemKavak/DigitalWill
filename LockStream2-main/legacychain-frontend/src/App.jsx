import { useState, useEffect } from 'react';
import { isConnected, setAllowed, getAddress } from '@stellar/freighter-api';
import CryptoJS from 'crypto-js';
import './App.css';

const ENCRYPTION_KEY = 'GCHQOEGYIFS5QAFR6GPC7SUMK22MAFV7JMFZDBYF7JKBPXYGO3BVGHIM';

function App() {
  // Wallet and form states
  const [walletAddress, setWalletAddress] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [unlockDate, setUnlockDate] = useState(''); // datetime-local value
  const [secretMessage, setSecretMessage] = useState('');

  // UI states
  const [status, setStatus] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [countdown, setCountdown] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  const [hashCopied, setHashCopied] = useState('');
  const [toast, setToast] = useState('');
  const [history, setHistory] = useState([]);
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Connect wallet
  const handleConnect = async () => {
    try {
      if (await isConnected()) {
        await setAllowed();
        const obj = await getAddress();
        setWalletAddress(obj.address || obj);
        showToast('✅ Cüzdan bağlandı');
      } else {
        showToast('❌ Freighter Cüzdanı yüklü değil');
      }
    } catch {
      showToast('❌ Bağlantı hatası');
    }
  };

  // Clipboard actions
  const handleCopyWallet = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopyFeedback('Kopyalandı!');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleHashCopy = () => {
    if (!ipfsHash) return;
    navigator.clipboard.writeText(ipfsHash);
    setHashCopied('Kopyalandı!');
    setTimeout(() => setHashCopied(''), 2000);
  };

  // Toast helper
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Basic recipient validation (Stellar address heuristic)
  const isValidRecipient = recipient.length === 56 && recipient.startsWith('G');

  // Countdown calculation (days + hours + minutes), live update every 30s
  useEffect(() => {
    let timer;
    const updateCountdown = () => {
      if (!unlockDate) {
        setCountdown('');
        return;
      }
      const now = new Date();
      const target = new Date(unlockDate);
      const diff = target.getTime() - now.getTime();

      if (isNaN(target.getTime())) {
        setCountdown('❌ Geçersiz tarih');
        return;
      }

      if (diff <= 0) {
        setCountdown('🔓 Kilit tarihi geldi!');
        // Try to decrypt if we have an encrypted message in IPFS flow later
        if (secretMessage) {
          try {
            const bytes = CryptoJS.AES.decrypt(secretMessage, ENCRYPTION_KEY);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            setDecryptedMessage(originalText || '❌ Mesaj çözülemedi');
          } catch {
            setDecryptedMessage('❌ Mesaj çözülemedi');
          }
        }
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        setCountdown(`⏳ Kilit açılmasına ${days} gün ${hours} saat ${minutes} dakika kaldı`);
      }
    };

    updateCountdown();
    timer = setInterval(updateCountdown, 30000);
    return () => clearInterval(timer);
  }, [unlockDate, secretMessage]);

  // Simulated blockchain save (replace with real on-chain call later)
  const saveToBlockchain = async (hash) => {
    setStatus('🦊 Cüzdan onayı bekleniyor...');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStatus(`🏆 BAŞARILI! Web3 işlemi gönderildi. ID: ${hash} Stellar’a kilitlendi.`);
      setIpfsHash(hash);
      setHistory((prev) => [
        ...prev,
        {
          hash,
          date: new Date().toLocaleString(),
          amount,
          recipient,
        },
      ]);
      // Clear form fields
      setRecipient('');
      setAmount('');
      setUnlockDate('');
      setSecretMessage('');
      showToast('✅ İşlem başarıyla kaydedildi');
    }, 1500);
  };

  // Submit form: encrypt and send to backend, then simulate chain
  const handleSubmit = async () => {
    if (!walletAddress) return showToast('❌ Önce cüzdanı bağla');
    if (!recipient || !amount || !unlockDate) return showToast('❌ Gerekli alanları doldurun');
    if (!isValidRecipient) return showToast('❌ Varis adresi geçersiz');

    const cipherText = CryptoJS.AES.encrypt(secretMessage || '', ENCRYPTION_KEY).toString();
    setStatus('⏳ Mesaj şifreleniyor ve sunucuya gönderiliyor...');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/save-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cipherText,
          unlockDate,
          owner: walletAddress,
          recipient,
          amount,
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (data?.success && data?.ipfsHash) {
        await saveToBlockchain(data.ipfsHash);
      } else {
        setStatus('❌ Sunucu hatası!');
        showToast('❌ Sunucu hatası');
      }
    } catch {
      setLoading(false);
      setStatus('❌ Sunucuya bağlanılamadı! (backend kapalı)');
      showToast('❌ Backend kapalı olabilir');
    }
  };

  return (
    <div className="container">
      <div className="glass-card">
        <header>
          <h1>🏛️ LegacyChain</h1>
          <p>Geleceğe güvenli miras</p>
        </header>

        {toast && <div className="toast">{toast}</div>}

        {!walletAddress ? (
          <div className="login-area">
            <button onClick={handleConnect} className="btn-connect">
              🔗 Cüzdanı Bağla
            </button>
          </div>
        ) : (
          <div className="form-area">
            <div className="wallet-badge">
              👤 {walletAddress.substring(0, 6)}...
              <button className="copy-btn" onClick={handleCopyWallet}>
                📋
              </button>
            </div>
            {copyFeedback && <div className="copy-feedback">{copyFeedback}</div>}

            <label>Varis cüzdan adresi</label>
            <div className="input-with-icon">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="G ile başlayan 56 karakter"
              />
              {recipient && (
                <span className="validation-icon">{isValidRecipient ? '✅' : '❌'}</span>
              )}
            </div>

            <div className="row">
              <div className="col">
                <label>Tutar (XLM)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Örn: 100"
                />
              </div>
              <div className="col">
                <label>Kilit tarihi ve saati</label>
                <input
                  type="datetime-local"
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                />
              </div>
            </div>

            {countdown && <div className="countdown-box">{countdown}</div>}

            <label>Gizli vasiyet notu (şifreli)</label>
            <textarea
              rows="3"
              value={secretMessage}
              onChange={(e) => setSecretMessage(e.target.value)}
              placeholder="Sadece tarih geldiğinde çözülecek not"
            ></textarea>

            <button onClick={handleSubmit} className="btn-submit" disabled={loading}>
              {loading ? '⏳ İşlem yapılıyor...' : '🔒 MİRASI KİLİTLE'}
            </button>

            {status && (
              <div
                className={`status-box ${
                  status.includes('BAŞARILI')
                    ? 'success'
                    : status.includes('❌') || status.toLowerCase().includes('hata')
                    ? 'error'
                    : ''
                }`}
              >
                {status}
              </div>
            )}

            {ipfsHash && (
              <div className="hash-box">
                <strong>IPFS Hash:</strong> {ipfsHash}
                <button className="copy-btn" onClick={handleHashCopy}>
                  📋
                </button>
                {hashCopied && <div className="copy-feedback">{hashCopied}</div>}
              </div>
            )}

            {decryptedMessage && (
              <div className="message-box">
                <strong>🔓 Çözülen Mesaj:</strong>
                <div className="message-content">{decryptedMessage}</div>
              </div>
            )}

            {history.length > 0 && (
              <div className="history">
                <h4>📜 İşlem Geçmişi</h4>
                <div className="history-list">
                  {history.map((h, idx) => (
                    <div key={idx} className="history-item">
                      <div><strong>Tarih:</strong> {h.date}</div>
                      <div><strong>Tutar:</strong> {h.amount} XLM</div>
                      <div className="history-hash">
                        <strong>Hash:</strong> {h.hash}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="spinner-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}

export default App;
