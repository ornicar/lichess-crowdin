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

const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
const xmlAsString = { pretty: true, indent: '  ', newline: '\n', allowEmpty: true };

function makeSourceXml() {

  function makeResource(key, source, context) {
    const tweak = tweaks[key] || {};
    const name = tweak.rename || key;
    let resource, i, english;
    return (doc) => {
      const nbPlaceholders = (source.match(/%s/g) || []).length;
      if (!nbPlaceholders || tweak.type === 'string') {
        i = 1;
        english = source.replace(
          /%s/g,
          () => nbPlaceholders == 1 ? '%s' : ('%' + (i++) + '$s'));
        resource = doc.ele('string', { name: name }, english);
      } else {
        i = 2;
        english = source
          .replace(/%s/, () => nbPlaceholders == 1 ? '%d' : '%1$d')
            .replace(/%s/g, () => '%' + (i++) + '$d');
          resource = doc.ele('plurals', { name: name });
        resource.ele('item', { quantity: 'one' }, tweak.one || english);
        resource.ele('item', { quantity: 'other' }, tweak.other || english);
      }
      if (context) resource.commentBefore(context.replace('--', '-'));
    }
  };

  return Promise.all([
    englishTranslations(),
    getContextsByEnglish()
  ]).then(([enTrans, contexts]) => {
    const resources = xmlBuilder.begin().ele('resources');
    enTrans.forEach(en => {
      makeResource(en[0], en[1], findByKey(contexts, en[1]))(resources);
    });
    const str = xmlHeader + resources.end(xmlAsString);
    return fs.writeFile('dist/site.xml', str);
  });
}

function makeLangXml(lang) {

  function makeResource(key, source, trans) {
    const tweak = tweaks[key] || {};
    const name = tweak.rename || key;
    let resource, i;
    return (doc) => {
      const nbPlaceholders = (source.match(/%s/g) || []).length;
      if (!nbPlaceholders || tweak.type === 'string') {
        i = 1;
        trans = trans.replace(
          /%s/g,
          () => nbPlaceholders == 1 ? '%s' : ('%' + (i++) + '$s'));
        if (tweak.dropTranslations) trans = null;
        resource = doc.ele('string', { name: name }, trans);
      } else {
        i = 2;
        trans = trans
          .replace(/%s/, () => nbPlaceholders == 1 ? '%d' : '%1$d')
            .replace(/%s/g, () => '%' + (i++) + '$d');
          resource = doc.ele('plurals', { name: name });
        if (!tweak.dropTranslations) {
          resource.ele('item', { quantity: 'one' }, trans);
          resource.ele('item', { quantity: 'other' }, trans);
        }
      }
    }
  };

  return Promise.all([
    englishTranslations(),
    readTranslations('source/messages/messages.' + lang)
  ]).then(([enTrans, langTrans]) => {
    const resources = xmlBuilder.begin().ele('resources');
    enTrans.forEach(en => {
      makeResource(en[0], en[1], findByKey(langTrans, en[0]))(resources);
    });
    const str = xmlHeader + resources.end(xmlAsString);
    const filepath = 'dist/site.' + lang + '.xml';
    return fs.writeFile(filepath, str).then(() => filepath);
  });
}

switch (process.argv[2]) {
  case 'source-xml':
    makeSourceXml();
    break;
  case 'lang-xml':
    makeLangXml(process.argv[3]);
    break;
}
