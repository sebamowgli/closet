// 내 옷장 서비스워커: 앱 화면을 기기에 저장해서 홈 화면 앱처럼 빠르게 열려요.
const CACHE = "closet-v11";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 내 앱 파일: 인터넷이 되면 최신 파일, 안 되면 저장된 파일
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
    );
    return;
  }

  // 글꼴과 Firebase 라이브러리 파일: 저장해 두고 재사용
  if (["fonts.googleapis.com", "fonts.gstatic.com", "www.gstatic.com"].includes(url.hostname)) {
    e.respondWith(
      caches.match(req).then((r) => r || fetch(req).then((res) => {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
      }))
    );
  }
  // 그 밖(Firestore 데이터, 로그인 통신)은 건드리지 않고 그대로 통과
});
