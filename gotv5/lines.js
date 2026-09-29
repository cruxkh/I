// Voice-over phrases (global seconds, measured on audio/vo.wav). he = big Hebrew subtitle, en = small English gloss.
const _L = [
  [0.10, 2.66, 'מחפשים את כל התוכן שאתם אוהבים במקום אחד?', 'Looking for all the content you love in one place?'],
  [3.00, 4.64, 'אם כן, הגעתם למקום הנכון.', "If so, you've come to the right place."],
  [4.97, 6.41, 'כל השידורים החיים בישראל', 'All the live broadcasts in Israel'],
  [6.69, 8.82, 'תכנים מנטפליקס, תכנים מדיסני פלוס', 'Content from Netflix, content from Disney Plus'],
  [9.02, 10.09, 'כל ערוצי הספורט', 'All the sports channels'],
  [10.20, 11.80, "כולל ספורט 5 וצ'רלטון", 'including Sport 5 and Charlton'],
  [12.00, 15.44, 'סדרות טורקיות, קוריאניות, אנימה ועוד המון תוכן', 'Turkish and Korean series, anime and lots more'],
  [15.79, 18.56, 'והכי חשוב, הספרייה מתעדכנת לאורך כל השבוע', 'Most importantly, the library updates all week long'],
  [18.80, 20.34, 'ככה שתמיד יש משהו חדש לראות', "so there's always something new to watch"],
  [20.68, 23.56, 'יש לכם גם שידורים חיים, עם חוויית צפייה מהירה וחלקה', 'You also get live broadcasts, with a fast and smooth viewing experience'],
  [24.01, 25.22, 'והדבר שאנחנו הכי גאים בו?', "And what we're proudest of?"],
  [25.64, 27.23, 'אין תקיעות. נקודה.', 'No freezing. Period.'],
  [27.19, 29.96, 'בלי להיתקע בדיוק ברגע החשוב', 'Never stuck at exactly the crucial moment'],
  [30.12, 32.09, 'פשוט לוחצים, וצופים', 'Just press, and watch'],
  [32.05, 35.25, 'כל התוכן שאתם אוהבים, השידורים החיים שאתם צריכים,', 'All the content you love, the live broadcasts you need,'],
  [35.21, 36.90, 'וחוויית צפייה בלי תקיעות', 'and a viewing experience without freezing'],
];
A.LINES = _L.map(([t, end, he, en]) => {
  const ws = en.split(' '), wt = ws.map(w => w.length + 2.5), tot = wt.reduce((a, b) => a + b, 0); let acc = 0;
  return { t, end, he, en, words: ws.map((w, i) => { const o = { w, t: t + 0.02 + (end - t - 0.08) * acc / tot }; acc += wt[i]; return o; }) };
});
