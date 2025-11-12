
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs, addDoc, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    // <<< COLA AS TUAS CHAVES DO PROJECTO kwanzaredes AQUI >>>
    apiKey: "COLE-AQUI",
    authDomain: "kwanzaredes.firebaseapp.com",
    projectId: "kwanzaredes",
    storageBucket: "kwanzaredes.appspot.com",
    messagingSenderId: "COLE-AQUI",
    appId: "COLE-AQUI"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let user = null;

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
    document.getElementById('saldo').innerText = snap.exists() ? snap.data().saldo || 0 : 0;
}

async function carregaTarefas() {
    const querySnapshot = await getDocs(collection(db, "tarefas"));
    let html = "";
    querySnapshot.forEach((doc) => {
        const t = doc.data();
        html += `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h5>${t.descricao}</h5>
                        <p class="text-success fw-bold">${t.valor} Kz</p>
                        <button class="btn btn-primary" onclick="fazerTarefa('${doc.id}', '${t.valor}', '${t.link}')">
                            Fazer agora
                        </button>
                    </div>
                </div>
            </div>`;
    });
    document.getElementById('tarefas').innerHTML = html || "<p class='text-center'>Sem tarefas no momento...</p>";
}

window.fazerTarefa = async (id, valor, link) => {
    window.open(link, '_blank');
    setTimeout(async () => {
        if (confirm("Já seguiste/curtiste/comentaste?")) {
            await addDoc(collection(db, "concluidas"), { user: user.uid, tarefa: id, data: serverTimestamp() });
            await updateDoc(doc(db, "users", user.uid), { saldo: increment(parseInt(valor)) });
            alert(valor + " Kz creditados! 💸");
            carregaSaldo();
        }
    }, 20000); // 20 segundos pra fazer
};

window.sacar = () => alert("Saque mínimo 5.000 Kz via Multicaixa/Unitel Money - Em breve!");
window.logout = () => {
    signOut(auth);
    window.location.href = "index.html";
};
