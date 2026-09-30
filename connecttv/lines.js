// Voice-over phrases (global seconds, measured on audio/vo_original_tts.wav). he = big Hebrew subtitle, en = small English gloss.
const _L = [
  [0.120, 1.070, "פותחים את המסך", "Open the screen"],
  [1.260, 3.170, "והעולם של הבידור נפתח בפניכם", "And the world of entertainment opens up to you"],
  [3.410, 5.230, "סרטים וסדרות מנטפליקס", "Movies and series from Netflix"],
  [5.350, 6.660, "תכנים מדיסני פלוס", "Content from Disney Plus"],
  [6.780, 8.850, "כל ערוצי הספורט כולל צ'רלטון", "All the sports channels, including Charlton"],
  [8.880, 9.980, "סדרות טורקיות", "Turkish series"],
  [10.000, 11.030, "סדרות הודיות", "Indian series"],
  [11.050, 12.660, "וכל השידורים החיים מישראל", "And all the live broadcasts from Israel"],
  [13.080, 14.090, "הכול במקום אחד", "Everything in one place"],
  [14.430, 15.235, "הכול נגיש", "Everything is accessible"],
  [15.360, 16.970, "והכול מתעדכן לאורך השבוע", "And everything updates all week long"],
  [17.400, 18.660, "משחקים בשידור חי", "Games, live"],
  [18.780, 20.360, "הסדרות שאתם מחכים להן", "The series you are waiting for"],
  [20.420, 21.950, "והתוכן שתמיד כיף לגלות", "And the content that is always fun to discover"],
  [22.360, 23.530, "לא צריך לחפש", "No need to search"],
  [23.550, 24.800, "לא צריך לעבור בין שירותים", "No need to switch between services"],
  [25.080, 26.280, "פשוט בוחרים מה לראות", "Just pick what to watch"],
  [26.300, 27.430, "ומתחילים לצפות", "And start watching"],
];
A.LINES = _L.map(([t, end, he, en]) => {
  const ws = en.split(' '), wt = ws.map(w => w.length + 2.5), tot = wt.reduce((a, b) => a + b, 0); let acc = 0;
  return { t, end, he, en, words: ws.map((w, i) => { const o = { w, t: t + 0.02 + (end - t - 0.08) * acc / tot }; acc += wt[i]; return o; }) };
});
