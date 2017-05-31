const gen = require('./gen');
const http = require('request-promise');
const fs = require('fs-extra');
const util = require('./util');
const xmlBuilder = require('xmlbuilder');

const toFix = [
  'nbGames',
  'nbBookmarks',
  'nbDays',
  'nbHours',
  'nbGamesWithYou',
  'nbWins',
  'nbLosses',
  'nbDraws',
  'nbMembers',
  'nbImportedGames',
  'nbFollowers',
  'playedXTimes',
  'nbGamesInPlay',
  'nbForumPosts'
];

function fix(lang) {
  return gen.makeLangXml(lang, toFix).then(filepath => {
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

switch (process.argv[2]) {
 case 'one':
   fix(process.argv[3]);
   break;
 case 'all':
   util.targets.reduce((p, target) => {
     return p.then(() => fix(util.toLichessTarget(target)));
   }, Promise.resolve());
   break;
}
