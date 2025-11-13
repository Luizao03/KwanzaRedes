import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, addDoc, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// === TUAS CHAVES REAIS DO PROJETO KwanzaRedes (copiado agora do Firebase) ===
const firebaseConfig = {
  apiKey: "AIzaSyA4zPrPZXT9UFWvrtUkZrnMfHxab9PwcKE",
  authDomain: "kwanzaredes.firebaseapp.com",
  projectId: "kwanzaredes",
  storageBucket: "kwanzaredes.firebasestorage.app",
  messagingSenderId: "1056060587689",
  appId: "1:1056060587689:web:64b29b3913d91d53e2b3b8",
  measurementId: "G-K0GZDDQ1F0"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let user = null;

// === LOGIN E REGISTRO (index.html) ===
if (document.getElementById('loginForm')) {
    window.login = async () => {
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        try {
            await signInWithEmailAndPassword(auth, email, senha);
            window.location.href = "dashboard.html";
        } catch (e) {
            alert("Erro no login: " + e.message);
        }
    };

    window.registro = async () => {
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        if (senha.length < 6) {
            alert("Senha deve ter pelo menos 6 caracteres!");
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, email, senha);
            await setDoc(doc(db, "users", auth.currentUser.uid), {
                saldo: 5000,  // BÓNUS DE BOAS-VINDAS
                email: email,
                criadoEm: serverTimestamp()
            });
            alert("Registrado com sucesso! Ganhaste 5.000 Kz GRÁTIS!");
            window.location.href = "dashboard.html";
        } catch (e) {
            alert("Erro no registro: " + e.message);
        }
    };
}

// === DASHBOARD (dashboard.html) ===
onAuthStateChanged(auth, async (u) => {
    user = u;
    if (u && document.getElementById('dashboard')) {
        document.getElementById('userEmail').innerText = u.email;
        await carregaSaldo();
        carregaTarefas();
    } else if (!u && document.getElementById('dashboard')) {
        window.location.href = "index.html";
    }
});

async function carregaSaldo() {
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    const saldo = snap.exists() ? (snap.data().saldo || 0) : 0;
    document.getElementById('saldo').innerText = saldo.toLocaleString('pt-AO');
}

async function carregaTarefas() {
    const querySnapshot = await getDocs(collection(db, "tarefas"));
    let html = "<h3 class='text-center mb-4'>🚀 TAREFAS DISPONÍVEIS (50+)</h3><div class='row'>";
    querySnapshot.forEach((doc) => {
        const t = doc.data();
        html += `
            <div class="col-md-6 mb-3">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h6 class="card-title">${t.descricao}</h6>
                        <p class="text-success fw-bold mb-2">+${t.valor} Kz</p>
                        <button class="btn btn-primary btn-sm" onclick="fazerTarefa('${doc.id}', '${t.valor}', '${t.link}')">
                            Fazer Agora
                        </button>
                    </div>
                </div>
            </div>`;
    });
    html += "</div>";
    document.getElementById('tarefas').innerHTML = html || "<p class='text-center'>Carregando tarefas...</p>";
}

window.fazerTarefa = async (id, valor, link) => {
    window.open(link, '_blank');
    setTimeout(async () => {
        if (confirm("✅ Já seguiste/curtiste/comentaste?")) {
            await addDoc(collection(db, "concluidas"), {
                user: user.uid,
                tarefa: id,
                data: serverTimestamp()
            });
            await updateDoc(doc(db, "users", user.uid), {
                saldo: increment(parseInt(valor))
            });
            alert(`+${valor} Kz creditados! Total: ${parseInt(valor) + await getSaldoAtual()} Kz`);
            carregaSaldo();
        }
    }, 20000);
};

async function getSaldoAtual() {
    const snap = await getDoc(doc(db, "users", user.uid));
    return snap.exists() ? snap.data().saldo || 0 : 0;
}

window.sacar = () => {
    const saldo = document.getElementById('saldo').innerText.replace(/\D/g,'');
    if (parseInt(saldo) >= 5000) {
        alert("Saque solicitado! Enviaremos via Multicaixa/Unitel Money em 24h.");
    } else {
        alert("Mínimo para saque: 5.000 Kz");
    }
};

window.logout = () => {
    signOut(auth);
    window.location.href = "index.html";
};
