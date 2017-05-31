const gen = require('./gen');
const http = require('request-promise');
const fs = require('fs-extra');
const extract = require('extract-zip');

const util = require('./util');

function showProject() {
  http.get(util.makeUrl('/info', '&json')).then(console.log);
}

function uploadTranslation(lang) {
  return gen.makeLangXml(lang).then(filepath => {
    const args = '&json&import_eq_suggestions=1&language=' + util.toCrowdinTarget(lang);
    const url = util.makeUrl('/upload-translation', args);
    console.log(filepath);
    return http.post({
      url: url,
      formData: {
        'files[master/translation/source/site.xml]': fs.createReadStream(filepath)
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
      return http.post(util.makeUrl('/export', '&json'))
    }).then(() => {
      console.log('Downloading all.zip');
      return http.post(util.makeUrl('/download/all.zip', ''))
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
    util.targets.forEach(t => { args += '&languages[]=' + t; });
    http.post(util.makeUrl('/edit-project', args)).then(() => showProject());
    break;
 case 'upload-translation':
   uploadTranslation(process.argv[3]);
   break;
 case 'upload-all-translations':
   util.targets.reduce((p, target) => {
     return p.then(() => uploadTranslation(util.toLichessTarget(target)));
   }, Promise.resolve());
   break;
 case 'export-all':
   exportAll();
   break;
}
