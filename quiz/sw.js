/* 단어 시험 전용 오프라인 캐시.
   내용을 고쳐 올릴 때는 아래 CACHE 이름의 숫자를 올려야 새 파일을 받아온다. */
var CACHE = "vocab-quiz-v2";
var ASSETS = ["./", "./index.html", "./manifest.json",
              "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
    .then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
/* 화면(HTML)은 네트워크 우선. 새로 올린 파일이 바로 반영되고, 인터넷이 없을 때만 캐시를 쓴다.
   아이콘 같은 나머지는 캐시 우선. */
function isPage(req){
  return req.mode === "navigate" ||
         (req.headers.get("accept") || "").indexOf("text/html") > -1;
}
function store(req, res){
  if(res && res.status === 200 && res.type === "basic"){
    var copy = res.clone();
    caches.open(CACHE).then(function(c){ c.put(req, copy); });
  }
  return res;
}
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  if(isPage(e.request)){
    e.respondWith(
      fetch(e.request).then(function(res){ return store(e.request, res); })
        .catch(function(){
          return caches.match(e.request).then(function(hit){
            return hit || caches.match("./index.html");
          });
        })
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(function(hit){
    return hit || fetch(e.request).then(function(res){ return store(e.request, res); });
  }));
});
