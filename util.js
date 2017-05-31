const apiKey = process.env['CROWDIN_API_KEY'];

if (!apiKey) {
  console.error('export CROWDIN_API_KEY');
  process.exit(1);
}

function makeUrl(path, args) {
  return 'https://api.crowdin.com/api/project/lichess' + path + '?key=' + apiKey + (args || '');
}

const targets = [
  'af',
  'ar',
  'as',
  'az',
  'be',
  'bg',
  'bn',
  'bs',
  'ca',
  'cs',
  'cv',
  'cy',
  'da',
  'de',
  'el',
  'eo',
  'es-ES',
  'et',
  'eu',
  'fa',
  'fi',
  'fo',
  'frp', // arpitan (fp)
  'fr',
  'fy-NL',
  'ga-IE',
  'gd',
  'gl',
  'gu-IN',
  'he',
  'hi',
  'hr',
  'hu',
  'hy-AM',
  'ia',
  'id',
  'io',
  'is',
  'it',
  'ja',
  'jbo', // lojban (jb)
  'jv',
  'ka',
  'kab', // (kb)
  'kk',
  'kn',
  'ko',
  'ky',
  'la-LA',
  // 'le',
  'lt',
  'lv',
  'mg',
  'mk',
  'ml-IN',
  'mn',
  'mr',
  'nb',
  'nl',
  'nn-NO',
  'pi',
  'pl',
  'ps',
  'pt-BR',
  'ro',
  'ru',
  'sa',
  'sk',
  'sl',
  'sq',
  'sr',
  'sv-SE',
  'sw',
  'ta',
  'zh-CN', // trad. chinese (tc)
  'tg',
  'th',
  'tl',
  'tp',
  'tr',
  'uk',
  'ur-IN',
  'vi',
  'yo',
  'zh-TW',
  'zu',
];

const lichessToCrowdinTarget = {
  es: 'es-ES',
  fp: 'frp',
  fy: 'fy-NL',
  ga: 'ga-IE',
  gu: 'gu-IN',
  hy: 'hy-AM',
  jb: 'jbo',
  kb: 'kab',
  la: 'la-LA',
  ml: 'ml-IN',
  nn: 'nn-NO',
  pt: 'pt-BR', // yes lichess current pt is pt-BR, not pt-PT
  sv: 'sv-SE',
  tc: 'zh-CN',
  ur: 'ur-IN',
  zh: 'zh-TW'
};

function toCrowdinTarget(t) {
  return lichessToCrowdinTarget[t] || t;
}
function toLichessTarget(t) {
  for(let k in lichessToCrowdinTarget) {
    if (lichessToCrowdinTarget[k] === t) return k;
  }
  return t;
}

module.exports = {
  makeUrl,
  targets,
  toCrowdinTarget,
  toLichessTarget
};
