const fs = require('fs-extra');
const xmlBuilder = require('xmlbuilder');

const allLangs = 'en,fr,ru,de,tr,sr,lv,bs,da,es,ro,it,fi,uk,pt,pl,nl,vi,sv,cs,sk,hu,ca,sl,az,nn,eo,tp,el,fp,lt,nb,et,hy,af,hi,ar,zh,gl,hr,mk,id,ja,bg,th,fa,he,mr,mn,cy,gd,ga,sq,be,ka,sw,ps,is,kk,io,gu,fo,eu,bn,id,la,jv,ky,pi,as,le,ta,sa,ml,kn,ko,mg,kb,zu,ur,yo,tl,fy,jb,tg,cv,ia,tc'.split(',').filter(l => l != 'en');

function readFile(name) {
  return fs.readFile(name, {
    encoding: 'utf8'
  });
}

// key=some value
function parseEqualityText(text) {
  return text.split('\n').map(l => {
    const s = l.split('=');
    if (s.length > 1) return [s[0].trim(), s.slice(1).join('=').trim()];
  }).filter(l => !!l);
}

// [['English version', 'Context'], ...]
function getContextsByEnglish() {
  return readFile('source/contexts.md').then(parseEqualityText);
}

// [["key", "Translation"]]
function readTranslations(file) {
  return readFile(file).then(parseEqualityText);
}

function englishTranslations() {
  return readTranslations('source/messages/messages');
}

function allTranslations() {
  return Promise.all(allLangs.map(lang => {
    return readTranslations('source/messages/messages.' + lang);
  }));
}

function findByKey(haystack, needle) {
  return (haystack.find(c => c[0] === needle) || [])[1];
}

const tweaks = {
  gamesBeingPlayedRightNow: {
    rename: 'currentGames'
  },
  aiNameLevelAiLevel: {
    type: 'string'
  },
  nbConnectedPlayers: {
    rename: 'nbPlayers'
  },
  viewAllNbGames: {
    rename: 'nbGames',
    one: 'One game'
  },
  viewNbCheckmates: {
    rename: 'nbCheckmates',
    one: 'One checkmate'
  },
  nbBookmarks: {
    one: 'One bookmark'
  },
  xPostedInForumY: {
    type: 'string'
  },
  nbDays: {
    one: 'One day'
  },
  nbHours: {
    one: 'One hour'
  },
  nbGamesWithYou: {
    one: 'One game with you'
  },
  nbWins: {
    one: 'One win'
  },
  nbLosses: {
    one: 'One loss'
  },
  nbDraws: {
    one: 'One draw'
  },
  nbMembers: {
    one: 'One member'
  },
  xJoinedTeamY: {
    type: 'string'
  },
  xCreatedTeamY: {
    type: 'string'
  },
  nbImportedGames: {
    one: 'One imported game'
  },
  colorPlaysCheckmateInOne: {
    type: 'string'
  },
  xStartedFollowingY: {
    type: 'string'
  },
  nbFollowers: {
    one: 'One follower'
  },
  lastSeenActive: {
    type: 'string'
  },
  lessThanNbMinutes: {
    one: 'Less than a minute'
  },
  reportXToModerators: {
    type: 'string'
  },
  yourPuzzleRatingX: {
    type: 'string'
  },
  puzzleId: {
    type: 'string'
  },
  ratingX: {
    type: 'string'
  },
  playedXTimes: {
    one: 'Played one time'
  },
  fromGameLink: {
    type: 'string'
  },
  nbGamesInPlay: {
    one: 'One game in play'
  },
  by: {
    type: 'string'
  },
  claimDrawOnThreefoldRepetitionAutomatically: {
    dropMarkers: true, // "%sthreefold repetition%s" -> "threefold repetition"
  },
  xLeftANoteOnY: {
    type: 'string'
  },
  xCompetesInY: {
    type: 'string'
  },
  xAskedY: {
    type: 'string'
  },
  xAnsweredY: {
    type: 'string'
  },
  xCommentedY: {
    type: 'string'
  },
  ifRatingIsPlusMinusX: {
    type: 'string'
  },
  nbForumPosts: {
    one: 'One forum post'
  },
  tpTimeSpentPlaying: {
    type: 'string'
  },
  tpTimeSpentOnTV: {
    type: 'string'
  },
  weeklyPerfTypeRatingDistribution: {
    type: 'string'
  },
  nbPerfTypePlayersThisWeek: {
    one: 'One %s players this week.'
  },
  yourPerfTypeRatingisRating: {
    type: 'string'
  },
  youAreBetterThanPercentOfPerfTypePlayers: {
    // percent then plural
  },
  youDoNotHaveAnEstablishedPerfTypeRating: {
    type: 'string'
  },
  weHaveSentYouAnEmailTo: {
    type: 'string'
  },
  byRegisteringYouAgreeToBeBoundByOur: {
    type: 'string'
  },
  youHaveAlreadyRegisteredTheEmail: {
    type: 'string'
  }
};

function makeSourceXml() {
  return Promise.all([
    englishTranslations(),
    getContextsByEnglish()
  ]).then(([enTrans, contexts]) => {
    const resources = xmlBuilder.begin({
      version: '1.0',
      encoding: 'UTF-8'
    }).ele('resources');
    enTrans.forEach(en => {
      const key = en[0];
      const source = en[1];
      const context = findByKey(contexts, source);
      let item;
      if (source.includes('%s')) {
        item = resources.ele('plurals', { name: key });
        item.ele('item', { quantity: 'one' }, source);
        item.ele('item', { quantity: 'other' }, source);
      }
      else item = resources.ele('string', { name: key }, source);
      if (context) item.commentBefore(context.replace('--', '-'));
    });
    const str = '<?xml version="1.0" encoding="UTF-8"?>\n' + resources.end({
      pretty: true,
      indent: '  ',
      newline: '\n',
      allowEmpty: true
    });
    return fs.writeFile('dist/site.xml', str);
  });
}

switch (process.argv[2]) {
  case 'source-xml':
    makeSourceXml();
    break;
}
