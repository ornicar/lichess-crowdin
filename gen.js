const fs = require('fs-extra');
const xmlBuilder = require('xmlbuilder');
const tweaks = require('./tweaks');

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

function makeResource(key, source, context) {
  const tweak = tweaks[key] || {};
  const name = tweak.rename || key;
  let resource, i, english;
  return (doc) => {
    if (!source.includes('%s') || tweak.type === 'string') {
      i = 1;
      english = source.replace(/%s/g, () => '%' + (i++) + '$s');
      resource = doc.ele('string', { name: name }, english);
    } else {
      i = 2;
      let english = source
        .replace(/%s/, () => '%1$d')
        .replace(/%s/g, () => '%' + (i++) + '$d');
      resource = doc.ele('plurals', { name: name });
      resource.ele('item', { quantity: 'one' }, tweak.one || english);
      resource.ele('item', { quantity: 'other' }, tweak.other || english);
    }
    if (context) resource.commentBefore(context.replace('--', '-'));
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
      makeResource(en[0], en[1], findByKey(contexts, en[1]))(resources);
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
