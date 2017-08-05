const fs = require('fs-extra');
const http = require('request-promise');
const xmlBuilder = require('xmlbuilder');
const xml2js = require('xml2js');
const util = require('../util');

const fileName = 'site';

function getOrigFiles() {
  return fs.readdir(`orig/${fileName}`).then(files => files.filter(n => n.endsWith('.xml')));
}

function parseXml(str) {
  return new Promise((resolve, reject) => {
    new xml2js.Parser().parseString(str, (err, xml) => err ? reject(err) : resolve(xml));
  });
}

function getOrig(lang) {
  return fs.readFile(`orig/${fileName}/${lang}.xml`, 'utf8').then(parseXml).then(xml => ({lang, xml}));
}

function getCrowdin(target) {
  console.log(`Fetch ${target}`);
  const args = `&json&file=master/translation/source/${fileName}.xml&language=${target}`;
  const url = util.makeUrl('/export-file', args);
  return http.get(url).then(parseXml).then(xml => ({target, xml})).catch(err => {
    if (target.includes('-')) return getCrowdin(target.replace(/(.+)-.+$/, '$1'));
  });
}

function has(resources, resource) {
  return resources.find(r => r.$.name === resource.$.name);
}

function findMissing(orig, crowdin) {
  const missing = {
    string: [],
    plurals: [],
    total: 0
  };
  ['string', 'plurals'].forEach(key => {
    (orig.xml.resources[key] || []).forEach(resource => {
      if (!has(crowdin.xml.resources[key], resource)) {
        missing[key].push(resource);
        missing.total++;
      }
    });
  });

  console.log(`${missing.total} missing messages`);
  return missing;
}

function writeFixes(lang, missing) {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  const xmlAsString = { pretty: true, indent: '  ', newline: '\n', allowEmpty: true };
  const doc = xmlBuilder.begin().ele('resources');
  missing.string.forEach(missing => {
    doc.ele('string', { name: missing.$.name }, missing._);
  });
  missing.plurals.forEach(missing => {
    const resource = doc.ele('plurals', { name: missing.$.name });
    missing.item.forEach(item => {
      resource.ele('item', { quantity: item.$.quantity }, item._);
    });
  });
  const str = xmlHeader + doc.end(xmlAsString);
  const file = `fixes/${lang}.xml`;
  return fs.writeFile(file, str).then(_ => file);
}

function postFixes(target, file) {
  const args = '&json&import_eq_suggestions=1&language=' + target;
  const url = util.makeUrl('/upload-translation', args);
  const data = {
    [`files[master/translation/source/${fileName}.xml]`]: fs.createReadStream(file)
  };
  console.log(url);
  return http.post({
    url: url,
    formData: data
  }).then(res => {
    console.log(res);
  });
}

function fix(orig, crowdin) {
  const missing = findMissing(orig, crowdin);
  if (!missing.total) return;
  writeFixes(orig.lang, missing).then(file => {
    return postFixes(crowdin.target, file);
  });
}

function doFile(file) {
  const lang = file.replace(/\.xml/, '');
  console.log('------------------------- ' + lang);
  return Promise.all([
    getOrig(lang),
    getCrowdin(lang)
  ]).then(([orig, crowdin]) => fix(orig, crowdin));
}

function doFiles(files) {
  if (files[0]) return doFile(files[0]).then(_ => doFiles(files.slice(1)));
}
process.on('unhandledRejection', r => console.log(r));
getOrigFiles().then(doFiles);
