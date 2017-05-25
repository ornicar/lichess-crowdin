const gen = require('./gen');
const http = require('request-promise');
const fs = require('fs-extra');

const apiKey = process.env['CROWDIN_API_KEY'];
if (!apiKey) {
  console.error('export CROWDIN_API_KEY');
  process.exit(1);
}

function makeUrl(path, args) {
  return 'https://api.crowdin.com/api/project/lichess' + path + '?key=' + apiKey + (args || '');
}

function showProject() {
  http.get(makeUrl('/info', '&json')).then(console.log);
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
  'pt-PT',
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
  es: 'es-ES'
};

function toCrowdinTarget(t) {
  return lichessToCrowdinTarget[t] || t;
}

switch (process.argv[2]) {
  case 'set-targets':
    let args = '';
    targets.forEach(t => { args += '&languages[]=' + t; });
    http.post(makeUrl('/edit-project', args)).then(() => showProject());
    break;
 case 'upload-translation':
   const lang = process.argv[3];
   gen.makeLangCsv(lang).then(filepath => {
     const args = '&import_eq_suggestions=1&language=' + toCrowdinTarget(lang);
     const url = makeUrl('/upload-translation', args);
     console.log(url);
     console.log(filepath);
     // const filepath = 'dist/site.' + lang + '.csv';
     http.post({
       url: url,
       formData: {
         'files[site.csv]': fs.createReadStream(filepath)
       }
     });
   });
   break;
}
