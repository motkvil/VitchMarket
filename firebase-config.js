/* Configuración de Firebase para el ranking online.
   Es el objeto firebaseConfig de la app web (consola de Firebase → Configuración del proyecto → Tus apps → Web).
   Esta configuración es pública por diseño: lo que protege los datos son las reglas de database.rules.json.
   Si se pone a null, el juego funciona igual, sin ranking. Analytics no se usa a propósito. */
window.FIREBASE_CONFIG={
  apiKey:"AIzaSyAmAfVaS2VJ_5oUD6zDDkOUkYokwQGq344",
  authDomain:"vitchmarket.firebaseapp.com",
  databaseURL:"https://vitchmarket-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:"vitchmarket",
  storageBucket:"vitchmarket.firebasestorage.app",
  messagingSenderId:"973472058168",
  appId:"1:973472058168:web:f99d609fff12841da64fcd"
};
