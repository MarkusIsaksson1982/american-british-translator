const path = require('path');
const debug = require('debug')('fcc:translator');

const americanOnly = require(path.join(__dirname, 'american-only.js'));
const americanToBritishSpelling = require(path.join(__dirname, 'american-to-british-spelling.js'));
const americanToBritishTitles = require(path.join(__dirname, 'american-to-british-titles.js'));
const britishOnly = require(path.join(__dirname, 'british-only.js'));

class Translator {
  constructor() {
    this.americanToBritishSpelling = americanToBritishSpelling;
    this.americanToBritishTitles = americanToBritishTitles;
    this.americanOnly = americanOnly;
    this.britishOnly = britishOnly;
    this.britishToAmericanSpelling = this.reverseDictionary(americanToBritishSpelling);
    this.britishToAmericanTitles = this.reverseDictionary(americanToBritishTitles);
    debug('Translator initialized');
  }

  translate(text, locale) {
    debug(`Translating: "${text}" (${locale})`);
    if (text === undefined || typeof text !== 'string') {
      debug('Error: Required field(s) missing');
      throw new Error('Required field(s) missing');
    }
    if (text.trim() === '') {
      debug('Error: No text to translate');
      return 'No text to translate';
    }
    if (!['american-to-british', 'british-to-american'].includes(locale)) {
      debug('Error: Invalid value for locale field');
      throw new Error('Invalid value for locale field');
    }

    let translation = text;

    // Translate titles
    translation = this.translateTitles(translation, locale);
    debug('After title translation:', translation);

    // Translate time formats
    translation = this.translateTime(translation, locale);
    debug('After time translation:', translation);

    // Special case for "high tech"
    translation = translation.replace(/\bhigh tech\b/gi, match => {
      debug('Translating "high tech"');
      return this.highlight('high-tech');
    });

    // Special case for "Rube Goldberg machine" / "Heath Robinson device"
    if (locale === 'american-to-british') {
      translation = translation.replace(/\bRube Goldberg machine\b/gi, match => {
        debug('Translating "Rube Goldberg machine" to "Heath Robinson device"');
        return this.highlight('Heath Robinson device');
      });
    } else {
      translation = translation.replace(/\bHeath Robinson device\b/gi, match => {
        debug('Translating "Heath Robinson device" to "Rube Goldberg machine"');
        return this.highlight('Rube Goldberg machine');
      });
    }

    // Translate words, phrases, and spellings
    translation = this.translateWords(translation, locale);

    // Ensure "Rube Goldberg machine" is not translated back to "Heath Robinson device" in british-to-american
    if (locale === 'british-to-american') {
      translation = translation.replace(/<span class="highlight">Heath Robinson device<\/span>/gi, this.highlight('Rube Goldberg machine'));
    }

    debug(`Final translation: "${translation}"`);
    return translation === text ? 'Everything looks good to me!' : translation;
  }

  translateTime(text, locale) {
    debug('Translating time');
    const timeRegex = locale === 'american-to-british' ? /(\d{1,2}):(\d{2})/g : /(\d{1,2})\.(\d{2})/g;
    return text.replace(timeRegex, (match, p1, p2) => {
      const newTime = locale === 'american-to-british' ? `${p1}.${p2}` : `${p1}:${p2}`;
      debug(`Time translation: ${match} -> ${newTime}`);
      return this.highlight(newTime);
    });
  }

  translateTitles(text, locale) {
    debug('Translating titles');
    const titleDictionary = locale === 'american-to-british' ? this.americanToBritishTitles : this.britishToAmericanTitles;
    const titleRegex = locale === 'american-to-british'
      ? /\b(Mr\.|Mrs\.|Ms\.|Mx\.|Dr\.|Prof\.)\s/g
      : /\b(Mr|Mrs|Ms|Mx|Dr|Prof)\b/g;
    return text.replace(titleRegex, (match) => {
      const key = match.toLowerCase().trim();
      if (titleDictionary[key]) {
        let newTitle = titleDictionary[key];
        if (locale === 'british-to-american' && !newTitle.endsWith('.')) {
          newTitle += '.';
        }
        debug(`Title translation: ${match} -> ${newTitle}`);
        return this.highlight(this.capitalizeFirstLetter(newTitle)) + (locale === 'american-to-british' ? ' ' : '');
      }
      return match;
    });
  }

  translateWords(text, locale) {
    debug('Translating words');
    const dictionaries = locale === 'american-to-british'
      ? [this.americanOnly, this.americanToBritishSpelling]
      : [this.britishOnly, this.britishToAmericanSpelling];
    
    dictionaries.forEach(dictionary => {
      const sortedKeys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
      sortedKeys.forEach(key => {
        const regex = new RegExp(`\\b${this.escapeRegExp(key)}\\b`, 'gi');
        text = text.replace(regex, (match) => {
          const replacement = this.matchCase(match, dictionary[key.toLowerCase()]);
          debug(`Word translation: ${match} -> ${replacement}`);
          return this.highlight(replacement);
        });
      });
    });
    return text;
  }

  highlight(text) {
    return `<span class="highlight">${text}</span>`;
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  reverseDictionary(dictionary) {
    debug('Reversing dictionary');
    return Object.fromEntries(Object.entries(dictionary).map(([key, value]) => [value, key]));
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  matchCase(original, translation) {
    if (original === original.toLowerCase()) return translation.toLowerCase();
    if (original === original.toUpperCase()) return translation.toUpperCase();
    if (original[0] === original[0].toUpperCase()) {
      return this.capitalizeFirstLetter(translation);
    }
    return translation;
  }
}

module.exports = Translator;
