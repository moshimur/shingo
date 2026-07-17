"use client";

import { useEffect, useMemo, useState } from "react";

type Signal = {
  name: string;
  area: string;
  lat: number;
  lng: number;
  direction: string;
  walk: number;
  stop: number;
  offset: number;
};

const signals: Signal[] = [
  { name: "渋谷駅前", area: "渋谷スクランブル交差点", lat: 35.6595, lng: 139.7005, direction: "ハチ公口 → センター街", walk: 32, stop: 48, offset: 9 },
  { name: "宮益坂下", area: "宮益坂下交差点", lat: 35.6608, lng: 139.7022, direction: "渋谷駅 → 宮益坂", walk: 28, stop: 52, offset: 34 },
  { name: "道玄坂下", area: "道玄坂下交差点", lat: 35.6584, lng: 139.6992, direction: "マークシティ → 文化村通り", walk: 36, stop: 44, offset: 61 },
];

const meterDistance = (a: { lat: number; lng: number }, b: Signal) => {
  const y = (a.lat - b.lat) * 111000;
  const x = (a.lng - b.lng) * 91000;
  return Math.round(Math.sqrt(x * x + y * y));
};

export default function Home() {
  const [position, setPosition] = useState({ lat: 35.6595, lng: 139.7005 });
  const [located, setLocated] = useState(false);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState("デモ位置：渋谷駅前");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const nearby = useMemo(() =>
    signals.map((signal) => ({ ...signal, distance: meterDistance(position, signal) }))
      .sort((a, b) => a.distance - b.distance), [position]);

  const signal = nearby[0];
  const elapsed = (Math.floor(now / 1000) + signal.offset) % (signal.walk + signal.stop);
  const isWalk = elapsed < signal.walk;
  const remaining = isWalk ? signal.walk - elapsed : signal.walk + signal.stop - elapsed;

  const locate = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      setNotice("この端末では位置情報を利用できません");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude });
        setLocated(true);
        setNotice("現在地を取得しました");
        setLocating(false);
      },
      () => {
        setNotice("位置情報を取得できませんでした。デモ位置で表示中です");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Signal Now ホーム">
          <span className="brand-mark"><i /><i /><i /></span>
          SIGNAL <b>NOW</b>
        </a>
        <span className="live"><i /> LIVE</span>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">NEAREST SIGNAL STATUS</div>
        <h1>次の青まで、<br /><span>あと何秒？</span></h1>
        <p className="lead">現在地から最寄りの信号を見つけて、切り替わりまでの時間をリアルタイムでお知らせします。</p>
        <button className="locate" onClick={locate} disabled={locating}>
          <span>⌖</span>{locating ? "現在地を確認中…" : located ? "現在地を更新" : "現在地を使う"}
        </button>
        <p className="location-note">● {notice}</p>
      </section>

      <section className="signal-panel" aria-live="polite">
        <div className="panel-head">
          <div><span className="label">最寄りの信号</span><h2>{signal.name}</h2><p>{signal.area}</p></div>
          <div className="distance"><b>{signal.distance < 1000 ? signal.distance : (signal.distance / 1000).toFixed(1)}</b><span>{signal.distance < 1000 ? "m" : "km"}</span></div>
        </div>

        <div className={`countdown ${isWalk ? "walk" : "stop"}`}>
          <div className="signal-light"><span /><span /><span /></div>
          <div className="count-copy">
            <span className="status">{isWalk ? "● 歩行者：青" : "● 歩行者：赤"}</span>
            <div className="seconds"><strong>{remaining}</strong><small>秒</small></div>
            <p>{isWalk ? "赤に変わるまで" : "青に変わるまで"}</p>
          </div>
        </div>

        <div className="direction"><span>↗</span><div><small>対象の横断方向</small><b>{signal.direction}</b></div></div>
        <div className="progress"><span style={{ width: `${(remaining / (isWalk ? signal.walk : signal.stop)) * 100}%` }} /></div>
        <div className="next"><span>次の状態</span><b>{isWalk ? "赤" : "青"}・{isWalk ? signal.stop : signal.walk}秒間</b></div>
      </section>

      <section className="nearby">
        <div className="section-title"><div><span className="eyebrow">AROUND YOU</span><h2>周辺の信号</h2></div><span>{nearby.length} SIGNALS</span></div>
        <div className="signal-list">
          {nearby.slice(1).map((item) => {
            const t = (Math.floor(now / 1000) + item.offset) % (item.walk + item.stop);
            const walking = t < item.walk;
            const left = walking ? item.walk - t : item.walk + item.stop - t;
            return <article key={item.name}><span className={walking ? "dot green" : "dot red"} /><div><b>{item.name}</b><small>{item.direction}</small></div><strong>{left}<small>秒</small></strong><em>{item.distance}m</em></article>;
          })}
        </div>
      </section>

      <aside className="safety"><span>!</span><p><b>安全のために</b>表示は実証用の参考情報です。実際の信号表示と周囲の交通状況を必ず確認してください。歩きながらの操作はお控えください。</p></aside>
      <footer><span>SIGNAL NOW / TOKYO BETA</span><small>交通を、もっとわかりやすく。</small></footer>
    </main>
  );
}
