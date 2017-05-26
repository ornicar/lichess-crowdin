const gen = require('./gen');
const http = require('request-promise');
const fs = require('fs-extra');
const extract = require('extract-zip');

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

function uploadTranslation(lang) {
  return gen.makeLangXml(lang).then(filepath => {
    const args = '&json&import_eq_suggestions=1&language=' + toCrowdinTarget(lang);
    const url = makeUrl('/upload-translation', args);
    console.log(filepath);
    return http.post({
      url: url,
      formData: {
        'files[test/site.xml]': fs.createReadStream(filepath)
      }
    }).then(res => {
      console.log(res);
    });
  });
}

function exportAll() {
  const dir = process.cwd() + '/export/messages';
  const zipFile = 'export/all.zip';
  fs.rmdir(dir)
    .then(() => fs.mkdir(dir))
    .then(() => {
      console.log('Rebuilding crowdin project, this can take a while');
      return http.post(makeUrl('/export', '&json'))
    }).then(() => {
      console.log('Downloading all.zip');
      return http.post(makeUrl('/download/all.zip', ''))
        .pipe(fs.createWriteStream(zipFile))
        .on('close', () => {
          console.log('Extracting');
          extract(zipFile, {dir: dir}, function (err) {
            if (err) {
              console.error(err);
              process.exit(1);
            }
            console.log('Extracted to ' + dir);
          })
        });
    });
}

switch (process.argv[2]) {
  case 'set-targets':
    let args = '';
    targets.forEach(t => { args += '&languages[]=' + t; });
    http.post(makeUrl('/edit-project', args)).then(() => showProject());
    break;
 case 'upload-translation':
   uploadTranslation(process.argv[3]);
   break;
 case 'upload-all-translations':
   targets.reduce((p, target) => {
     return p.then(() => uploadTranslation(toLichessTarget(target)));
   }, Promise.resolve());
   break;
 case 'export-all':
   exportAll();
   break;
}
