const fs = require('fs-extra');

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

const sep = '|';

function makeCsvWithAllLanguages() {
  return englishTranslations().then(enTrans => {
    return getContextsByEnglish().then(contexts => {
      return allTranslations().then(allTrans => {
        return enTrans.map(en => {
          const key = en[0];
          const source = en[1];
          const context = findByKey(contexts, source);
          const line = [key, context, source];
          allTrans.forEach(trans => {
            line.push(findByKey(trans, key));
          });
          return line;
        });
      });
    });
  }).then(body => {
    const header = ['key', 'context', 'source'].concat(allLangs);
    return [header].concat(body).map(line => line.join(sep)).join('\n');
  });
}

function makeSourceCsv() {
  return englishTranslations().then(enTrans => {
    return getContextsByEnglish().then(contexts => {
      return enTrans.map(en => {
        const key = en[0];
        const source = en[1];
        const context = findByKey(contexts, source);
        return [key, context, source, source];
      });
    });
  }).then(body => {
    return body.map(line => line.join(sep)).join('\n');
  });
}

function makeLangCsv(lang) {
  return Promise.all([
    englishTranslations(),
    getContextsByEnglish(),
    readTranslations('source/messages/messages.' + lang)
  ]).then(([enTrans, contexts, langTrans]) => {
    const content = enTrans.map(en => {
      const key = en[0];
      const source = en[1];
      const context = findByKey(contexts, source);
      const trans = findByKey(langTrans, key);
      return [key, context, source, trans];
    }).map(line => line.join(sep)).join('\n');
    const filepath = 'dist/site.' + lang + '.csv';
    return fs.writeFile(filepath, content).then(() => filepath);
  });
}

switch (process.argv[2]) {
  case 'messages':
    makeSourceCsv().then(csv => { fs.writeFile('dist/site.csv', csv); });
    break;
 case 'all':
   makeCsvWithAllLanguages().then(csv => { fs.writeFile('dist/site.csv', csv); });
   break;
 case 'lang':
   makeLangCsv(process.argv[3]);
   break;
}

module.exports = {
  makeLangCsv
};
