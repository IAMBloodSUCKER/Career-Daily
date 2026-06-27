/** Клиентский анализ текста чата (зеркало backend ChatTextAnalyzer). */
const ChatTextAnalyzer = (() => {
    const PROFANITY_TOKENS = [
        'хуй', 'хуя', 'хуе', 'хуи', 'хер', 'пизд', 'ебал', 'ебат', 'ебан', 'ебл', 'ебу', 'ёб',
        'бля', 'бляд', 'блят', 'сука', 'сук', 'муда', 'мудил', 'говн', 'shit', 'fuck', 'bitch',
        'asshole', 'дерьм', 'жоп', 'залуп', 'пидор', 'пидар', 'педик', 'манд', 'твар', 'срать'
    ];

    const RUDE_TOKENS = [
        'кончен', 'конч', 'идиот', 'дурак', 'дебил', 'тупой', 'тупая', 'отстань', 'отвали',
        'заткн', 'ненавиж', 'ублюд', 'мраз', 'скотин', 'урод', 'чмо', 'долбоеб', 'долбаеб',
        'мудак', 'кретин', 'придурок', 'шлюх', 'даун', 'козел', 'сволоч'
    ];

    function normalize(raw) {
        let s = String(raw || '').toLowerCase()
            .replace(/ё/g, 'е')
            .replace(/[@]/g, 'a')
            .replace(/[0134567$]/g, ch => ({
                '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '6': 'b', '7': 't', '$': 's'
            }[ch] || ch));
        return s.replace(/[^a-zа-я]/g, '');
    }

    function hasToken(text, tokens) {
        const compact = normalize(text);
        return tokens.some(t => compact.includes(t));
    }

    function classify(text) {
        if (!text || !String(text).trim()) return 'GENERIC';
        const lower = String(text).toLowerCase().trim();
        if (hasToken(lower, PROFANITY_TOKENS)) return 'PROFANITY';
        if (hasToken(lower, RUDE_TOKENS)) return 'RUDE';
        if (/увол|уволь|хочу\s+уйти|уйти\s+с\s+работ|quit\s+job|resign|уволиться|сваливаю/.test(lower)) {
            return 'RESIGNATION';
        }
        return 'GENERIC';
    }

    function isInappropriate(text) {
        const kind = classify(text);
        return kind === 'PROFANITY' || kind === 'RUDE' || kind === 'RESIGNATION';
    }

    /** CSS-класс для пометки сообщений игрока в UI. */
    function messageClass(text, fromPlayer) {
        if (!fromPlayer || !text || !String(text).trim()) return '';
        if (!isInappropriate(text)) return '';
        return classify(text) === 'RESIGNATION' ? ' chat-msg--sensitive' : ' chat-msg--flagged';
    }

    return { classify, isInappropriate, messageClass, normalize };
})();
