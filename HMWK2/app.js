const BIP39_WORDLIST = ["abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent", "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become", "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body", "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy", "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call", "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry", "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category", "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century", "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase", "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child", "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle", "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk", "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close", "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut", "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort", "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control", "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost", "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle", "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek", "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial", "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup", "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle", "dad", "damage", "damp", "dance", "danger", "daring", "dash", "daughter", "dawn", "day", "deal", "debate", "debris", "decade", "december", "decide", "decline", "decorate", "decrease", "deer", "defense", "define", "defy", "degree", "delay", "deliver", "demand", "demise", "denial", "dentist", "deny", "depart", "depend", "deposit", "depth", "deputy", "derive", "describe", "desert", "design", "desk", "despair", "destroy", "detail", "detect", "develop", "device", "devote", "diagram", "dial", "diamond", "diary", "dice", "diesel", "diet", "differ", "digital", "dignity", "dilemma", "dinner", "dinosaur", "direct", "dirt", "disagree", "discover", "disease", "dish", "dismiss", "disorder", "display", "distance", "divert", "divide", "divorce", "dizzy", "doctor", "document", "dog", "doll", "dolphin", "domain", "donate", "donkey", "donor", "door", "dose", "double", "dove", "draft", "dragon", "drama", "drastic", "draw", "dream", "dress", "drift", "drill", "drink", "drip", "drive", "drop", "drum", "dry", "duck", "dumb", "dune", "during", "dust", "dutch", "duty", "dwarf", "dynamic", "eager", "eagle", "early", "earn", "earth", "easily", "east", "easy", "echo", "ecology", "economy", "edge", "edit", "educate", "effort", "egg", "eight", "either", "elbow", "elder", "electric", "elegant", "element", "elephant", "elevator", "elite", "else", "embark", "embody", "embrace", "emerge", "emotion", "employ", "empower", "empty", "enable", "enact", "end", "endless", "endorse", "enemy", "energy", "enforce", "engage", "engine", "enhance", "enjoy", "enlist", "enough", "enrich", "enroll", "ensure", "enter", "entire", "entry", "envelope", "episode", "equal", "equip", "era", "erase", "erode", "erosion", "error", "erupt", "escape", "essay", "essence", "estate", "eternal", "ethics", "evidence", "evil", "evoke", "evolve", "exact", "example", "excess", "exchange", "excite", "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exile", "exist", "exit", "exotic", "expand", "expect", "expire", "explain", "expose", "express", "extend", "extra", "eye", "eyebrow", "fabric", "face", "faculty", "fade", "faint", "faith", "fall", "false", "fame", "family", "famous", "fan", "fancy", "fantasy", "farm", "fashion", "fat", "fatal", "father", "fatigue", "fault", "favorite", "feature", "february", "federal", "fee", "feed", "feel", "female", "fence", "festival", "fetch", "fever", "few", "fiber", "fiction", "field", "figure", "file", "film", "filter", "final", "find", "fine", "finger", "finish", "fire", "firm", "first", "fiscal", "fish", "fit", "fitness", "fix", "flag", "flame", "flash", "flat", "flavor", "flee", "flight", "flip", "float", "flock", "floor", "flower", "fluid", "flush", "fly", "foam", "focus", "fog", "foil", "fold", "follow", "food", "foot", "force", "forest", "forget", "fork", "fortune", "forum", "forward", "fossil", "foster", "found", "fox", "fragile", "frame", "frequent", "fresh", "friend", "fringe", "frog", "front", "frost", "frown", "frozen", "fruit", "fuel", "fun", "funny", "furnace", "fury", "future", "gadget", "gain", "galaxy", "gallery", "game", "gap", "garage", "garbage", "garden", "garlic", "garment", "gas", "gasp", "gate", "gather", "gauge", "gaze", "general", "genius", "genre", "gentle", "genuine", "gesture", "ghost", "giant", "gift", "giggle", "ginger", "giraffe", "girl", "give", "glad", "glance", "glare", "glass", "glide", "glimpse", "globe", "gloom", "glory", "glove", "glow", "glue", "goat", "goddess", "gold", "good", "goose", "gorilla", "gospel", "gossip", "govern", "gown", "grab", "grace", "grain", "grant", "grape", "grass", "gravity", "great", "green", "grid", "grief", "grit", "grocery", "group", "grow", "grunt", "guard", "guess", "guide", "guilt", "guitar", "gun", "gym", "habit", "hair", "half", "hammer", "hamster", "hand", "happy", "harbor", "hard", "harsh", "harvest", "hat", "have", "hawk", "hazard", "head", "health", "heart", "heavy", "hedgehog", "height", "hello", "helmet", "help", "hen", "hero", "hidden", "high", "hill", "hint", "hip", "hire", "history", "hobby", "hockey", "hold", "hole", "holiday", "hollow", "home", "honey", "hood", "hope", "horn", "horror", "horse", "hospital", "host", "hotel", "hour", "hover", "hub", "huge", "human", "humble", "humor", "hundred", "hungry", "hunt", "hurdle", "hurry", "hurt", "husband", "hybrid", "ice", "icon", "idea", "identify", "idle", "ignore", "ill", "illegal", "illness", "image", "imitate", "immense", "immune", "impact", "impose", "improve", "impulse", "inch", "include", "income", "increase", "index", "indicate", "indoor", "industry", "infant", "inflict", "inform", "inhale", "inherit", "initial", "inject", "injury", "inmate", "inner", "innocent", "input", "inquiry", "insane", "insect", "inside", "inspire", "install", "intact", "interest", "into", "invest", "invite", "involve", "iron", "island", "isolate", "issue", "item", "ivory", "jacket", "jaguar", "jar", "jazz", "jealous", "jeans", "jelly", "jewel", "job", "join", "joke", "journey", "joy", "judge", "juice", "jump", "jungle", "junior", "junk", "just", "kangaroo", "keen", "keep", "ketchup", "key", "kick", "kid", "kidney", "kind", "kingdom", "kiss", "kit", "kitchen", "kite", "kitten", "kiwi", "knee", "knife", "knock", "know", "lab", "label", "labor", "ladder", "lady", "lake", "lamp", "language", "laptop", "large", "later", "latin", "laugh", "laundry", "lava", "law", "lawn", "lawsuit", "layer", "lazy", "leader", "leaf", "learn", "leave", "lecture", "left", "leg", "legal", "legend", "leisure", "lemon", "lend", "length", "lens", "leopard", "lesson", "letter", "level", "liar", "liberty", "library", "license", "life", "lift", "light", "like", "limb", "limit", "link", "lion", "liquid", "list", "little", "live", "lizard", "load", "loan", "lobster", "local", "lock", "logic", "lonely", "long", "loop", "lottery", "loud", "lounge", "love", "loyal", "lucky", "luggage", "lumber", "lunar", "lunch", "luxury", "lyrics", "machine", "mad", "magic", "magnet", "maid", "mail", "main", "major", "make", "mammal", "man", "manage", "mandate", "mango", "mansion", "manual", "maple", "marble", "march", "margin", "marine", "market", "marriage", "mask", "mass", "master", "match", "material", "math", "matrix", "matter", "maximum", "maze", "meadow", "mean", "measure", "meat", "mechanic", "medal", "media", "melody", "melt", "member", "memory", "mention", "menu", "mercy", "merge", "merit", "merry", "mesh", "message", "metal", "method", "middle", "midnight", "milk", "million", "mimic", "mind", "minimum", "minor", "minute", "miracle", "mirror", "misery", "miss", "mistake", "mix", "mixed", "mixture", "mobile", "model", "modify", "mom", "moment", "monitor", "monkey", "monster", "month", "moon", "moral", "more", "morning", "mosquito", "mother", "motion", "motor", "mountain", "mouse", "move", "movie", "much", "muffin", "mule", "multiply", "muscle", "museum", "mushroom", "music", "must", "mutual", "myself", "mystery", "myth", "naive", "name", "napkin", "narrow", "nasty", "nation", "nature", "near", "neck", "need", "negative", "neglect", "neither", "nephew", "nerve", "nest", "net", "network", "neutral", "never", "news", "next", "nice", "night", "noble", "noise", "nominee", "noodle", "normal", "north", "nose", "notable", "note", "nothing", "notice", "novel", "now", "nuclear", "number", "nurse", "nut", "oak", "obey", "object", "oblige", "obscure", "observe", "obtain", "obvious", "occur", "ocean", "october", "odor", "off", "offer", "office", "often", "oil", "okay", "old", "olive", "olympic", "omit", "once", "one", "onion", "online", "only", "open", "opera", "opinion", "oppose", "option", "orange", "orbit", "orchard", "order", "ordinary", "organ", "orient", "original", "orphan", "ostrich", "other", "outdoor", "outer", "output", "outside", "oval", "oven", "over", "own", "owner", "oxygen", "oyster", "ozone", "pact", "paddle", "page", "pair", "palace", "palm", "panda", "panel", "panic", "panther", "paper", "parade", "parent", "park", "parrot", "party", "pass", "patch", "path", "patient", "patrol", "pattern", "pause", "pave", "payment", "peace", "peanut", "pear", "peasant", "pelican", "pen", "penalty", "pencil", "people", "pepper", "perfect", "permit", "person", "pet", "phone", "photo", "phrase", "physical", "piano", "picnic", "picture", "piece", "pig", "pigeon", "pill", "pilot", "pink", "pioneer", "pipe", "pistol", "pitch", "pizza", "place", "planet", "plastic", "plate", "play", "please", "pledge", "pluck", "plug", "plunge", "poem", "poet", "point", "polar", "pole", "police", "pond", "pony", "pool", "popular", "portion", "position", "possible", "post", "potato", "pottery", "poverty", "powder", "power", "practice", "praise", "predict", "prefer", "prepare", "present", "pretty", "prevent", "price", "pride", "primary", "print", "priority", "prison", "private", "prize", "problem", "process", "produce", "profit", "program", "project", "promote", "proof", "property", "prosper", "protect", "proud", "provide", "public", "pudding", "pull", "pulp", "pulse", "pumpkin", "punch", "pupil", "puppy", "purchase", "purity", "purpose", "purse", "push", "put", "puzzle", "pyramid", "quality", "quantum", "quarter", "question", "quick", "quit", "quiz", "quote", "rabbit", "raccoon", "race", "rack", "radar", "radio", "rail", "rain", "raise", "rally", "ramp", "ranch", "random", "range", "rapid", "rare", "rate", "rather", "raven", "raw", "razor", "ready", "real", "reason", "rebel", "rebuild", "recall", "receive", "recipe", "record", "recycle", "reduce", "reflect", "reform", "refuse", "region", "regret", "regular", "reject", "relax", "release", "relief", "rely", "remain", "remember", "remind", "remove", "render", "renew", "rent", "reopen", "repair", "repeat", "replace", "report", "require", "rescue", "resemble", "resist", "resource", "response", "result", "retire", "retreat", "return", "reunion", "reveal", "review", "reward", "rhythm", "rib", "ribbon", "rice", "rich", "ride", "ridge", "rifle", "right", "rigid", "ring", "riot", "ripple", "risk", "ritual", "rival", "river", "road", "roast", "robot", "robust", "rocket", "romance", "roof", "rookie", "room", "rose", "rotate", "rough", "round", "route", "royal", "rubber", "rude", "rug", "rule", "run", "runway", "rural", "sad", "saddle", "sadness", "safe", "sail", "salad", "salmon", "salon", "salt", "salute", "same", "sample", "sand", "satisfy", "satoshi", "sauce", "sausage", "save", "say", "scale", "scan", "scare", "scatter", "scene", "scheme", "school", "science", "scissors", "scorpion", "scout", "scrap", "screen", "script", "scrub", "sea", "search", "season", "seat", "second", "secret", "section", "security", "seed", "seek", "segment", "select", "sell", "seminar", "senior", "sense", "sentence", "series", "service", "session", "settle", "setup", "seven", "shadow", "shaft", "shallow", "share", "shed", "shell", "sheriff", "shield", "shift", "shine", "ship", "shiver", "shock", "shoe", "shoot", "shop", "short", "shoulder", "shove", "shrimp", "shrug", "shuffle", "shy", "sibling", "sick", "side", "siege", "sight", "sign", "silent", "silk", "silly", "silver", "similar", "simple", "since", "sing", "siren", "sister", "situate", "six", "size", "skate", "sketch", "ski", "skill", "skin", "skirt", "skull", "slab", "slam", "sleep", "slender", "slice", "slide", "slight", "slim", "slogan", "slot", "slow", "slush", "small", "smart", "smile", "smoke", "smooth", "snack", "snake", "snap", "sniff", "snow", "soap", "soccer", "social", "sock", "soda", "soft", "solar", "soldier", "solid", "solution", "solve", "someone", "song", "soon", "sorry", "sort", "soul", "sound", "soup", "source", "south", "space", "spare", "spatial", "spawn", "speak", "special", "speed", "spell", "spend", "sphere", "spice", "spider", "spike", "spin", "spirit", "split", "spoil", "sponsor", "spoon", "sport", "spot", "spray", "spread", "spring", "spy", "square", "squeeze", "squirrel", "stable", "stadium", "staff", "stage", "stairs", "stamp", "stand", "start", "state", "stay", "steak", "steel", "stem", "step", "stereo", "stick", "still", "sting", "stock", "stomach", "stone", "stool", "story", "stove", "strategy", "street", "strike", "strong", "struggle", "student", "stuff", "stumble", "style", "subject", "submit", "subway", "success", "such", "sudden", "suffer", "sugar", "suggest", "suit", "summer", "sun", "sunny", "sunset", "super", "supply", "supreme", "sure", "surface", "surge", "surprise", "surround", "survey", "suspect", "sustain", "swallow", "swamp", "swap", "swarm", "swear", "sweet", "swift", "swim", "swing", "switch", "sword", "symbol", "symptom", "syrup", "system", "table", "tackle", "tag", "tail", "talent", "talk", "tank", "tape", "target", "task", "taste", "tattoo", "taxi", "teach", "team", "tell", "ten", "tenant", "tennis", "tent", "term", "test", "text", "thank", "that", "theme", "then", "theory", "there", "they", "thing", "this", "thought", "three", "thrive", "throw", "thumb", "thunder", "ticket", "tide", "tiger", "tilt", "timber", "time", "tiny", "tip", "tired", "tissue", "title", "toast", "tobacco", "today", "toddler", "toe", "together", "toilet", "token", "tomato", "tomorrow", "tone", "tongue", "tonight", "tool", "tooth", "top", "topic", "topple", "torch", "tornado", "tortoise", "toss", "total", "tourist", "toward", "tower", "town", "toy", "track", "trade", "traffic", "tragic", "train", "transfer", "trap", "trash", "travel", "tray", "treat", "tree", "trend", "trial", "tribe", "trick", "trigger", "trim", "trip", "trophy", "trouble", "truck", "true", "truly", "trumpet", "trust", "truth", "try", "tube", "tuition", "tumble", "tuna", "tunnel", "turkey", "turn", "turtle", "twelve", "twenty", "twice", "twin", "twist", "two", "type", "typical", "ugly", "umbrella", "unable", "unaware", "uncle", "uncover", "under", "undo", "unfair", "unfold", "unhappy", "uniform", "unique", "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil", "update", "upgrade", "uphold", "upon", "upper", "upset", "urban", "urge", "usage", "use", "used", "useful", "useless", "usual", "utility", "vacant", "vacuum", "vague", "valid", "valley", "valve", "van", "vanish", "vapor", "various", "vast", "vault", "vehicle", "velvet", "vendor", "venture", "venue", "verb", "verify", "version", "very", "vessel", "veteran", "viable", "vibrant", "vicious", "victory", "video", "view", "village", "vintage", "violin", "virtual", "virus", "visa", "visit", "visual", "vital", "vivid", "vocal", "voice", "void", "volcano", "volume", "vote", "voyage", "wage", "wagon", "wait", "walk", "wall", "walnut", "want", "warfare", "warm", "warrior", "wash", "wasp", "waste", "water", "wave", "way", "wealth", "weapon", "wear", "weasel", "weather", "web", "wedding", "weekend", "weird", "welcome", "west", "wet", "whale", "what", "wheat", "wheel", "when", "where", "whip", "whisper", "wide", "width", "wife", "wild", "will", "win", "window", "wine", "wing", "wink", "winner", "winter", "wire", "wisdom", "wise", "wish", "witness", "wolf", "woman", "wonder", "wood", "wool", "word", "work", "world", "worry", "worth", "wrap", "wreck", "wrestle", "wrist", "write", "wrong", "yard", "year", "yellow", "you", "young", "youth", "zebra", "zero", "zone", "zoo"];

/* =========================================================================
   HMWK 2 — From Wallet Seed to Ethereum Address
   Cryptographic Primitives, Key Derivation & Statistical Properties
   ========================================================================= */

// -------------------------------------------------------------------------
// 1. Core Cryptographic Primitives
// -------------------------------------------------------------------------

/**
 * Keccak Sponge Construction (supports Keccak-256 and SHA3-256)
 * @param {number} bits - Digest length in bits (256)
 * @param {number} paddingByte - 0x01 for Ethereum Keccak-256, 0x06 for NIST SHA3-256
 * @param {Uint8Array|string} msg - Input data
 * @returns {Uint8Array} - 32-byte hash digest
 */
function keccak(bits, paddingByte, msg) {
    if (typeof msg === 'string') {
        msg = new TextEncoder().encode(msg);
    }
    const rate = (1600 - bits * 2) / 8; // 136 bytes for 256 bits
    const len = msg.length;
    const padLen = rate - (len % rate);
    const padded = new Uint8Array(len + padLen);
    padded.set(msg);
    padded[len] = paddingByte;
    padded[padded.length - 1] |= 0x80;

    const s = new BigUint64Array(25);
    const RC = [
        0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
        0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
        0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
        0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
        0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
        0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
    ];
    const rot = (x, n) => {
        n = BigInt(n);
        return ((x << n) | (x >> (64n - n))) & 0xFFFFFFFFFFFFFFFFn;
    };
    const RHO = [
        [0, 36, 3, 41, 18],
        [1, 44, 10, 45, 2],
        [62, 6, 43, 15, 61],
        [28, 55, 25, 21, 56],
        [27, 20, 39, 8, 14]
    ];

    function f(st) {
        for (let round = 0; round < 24; round++) {
            // Theta
            const C = new BigUint64Array(5);
            for (let x = 0; x < 5; x++) C[x] = st[x] ^ st[x + 5] ^ st[x + 10] ^ st[x + 15] ^ st[x + 20];
            const D = new BigUint64Array(5);
            for (let x = 0; x < 5; x++) D[x] = C[(x + 4) % 5] ^ rot(C[(x + 1) % 5], 1);
            for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) st[x + 5 * y] ^= D[x];

            // Rho and Pi
            const B = new BigUint64Array(25);
            for (let x = 0; x < 5; x++) {
                for (let y = 0; y < 5; y++) {
                    const newX = y;
                    const newY = (2 * x + 3 * y) % 5;
                    B[newX + 5 * newY] = rot(st[x + 5 * y], RHO[x][y]);
                }
            }

            // Chi
            for (let x = 0; x < 5; x++) {
                for (let y = 0; y < 5; y++) {
                    st[x + 5 * y] = B[x + 5 * y] ^ ((~B[((x + 1) % 5) + 5 * y]) & B[((x + 2) % 5) + 5 * y]);
                }
            }

            // Iota
            st[0] ^= RC[round];
        }
    }

    // Absorb
    for (let offset = 0; offset < padded.length; offset += rate) {
        for (let i = 0; i < rate / 8; i++) {
            let val = 0n;
            for (let b = 0; b < 8; b++) val |= BigInt(padded[offset + i * 8 + b]) << BigInt(b * 8);
            s[i] ^= val;
        }
        f(s);
    }

    // Squeeze
    const out = new Uint8Array(bits / 8);
    for (let i = 0; i < out.length / 8; i++) {
        const val = s[i];
        for (let b = 0; b < 8; b++) out[i * 8 + b] = Number((val >> BigInt(b * 8)) & 0xFFn);
    }
    return out;
}

function keccak256(data) {
    if (typeof data === 'string' && data.startsWith('0x')) {
        data = hexToBytes(data.slice(2));
    }
    return keccak(256, 0x01, data);
}

function sha3_256(data) {
    if (typeof data === 'string' && data.startsWith('0x')) {
        data = hexToBytes(data.slice(2));
    }
    return keccak(256, 0x06, data);
}

// -------------------------------------------------------------------------
// secp256k1 Elliptic Curve Implementation
// -------------------------------------------------------------------------

const SECP256K1_P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
const SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
const SECP256K1_GX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n;
const SECP256K1_GY = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n;

function mod(a, m = SECP256K1_P) {
    const r = a % m;
    return r >= 0n ? r : r + m;
}

function modInverse(k, m = SECP256K1_P) {
    let [m0, y, x] = [m, 0n, 1n];
    let a = mod(k, m);
    if (a === 1n) return 1n;
    while (a > 1n) {
        const q = a / m0;
        [a, m0] = [m0, a % m0];
        [x, y] = [y, x - q * y];
    }
    if (x < 0n) x += m;
    return x;
}

class CurvePoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static infinity() {
        return new CurvePoint(null, null);
    }
    isInfinity() {
        return this.x === null && this.y === null;
    }
    add(q) {
        if (this.isInfinity()) return q;
        if (q.isInfinity()) return this;
        if (this.x === q.x) {
            if (this.y !== q.y) return CurvePoint.infinity();
            // Tangent: lambda = (3 * x^2) / (2 * y)
            const lambda = mod(mod(3n * this.x * this.x) * modInverse(mod(2n * this.y)));
            const xr = mod(lambda * lambda - 2n * this.x);
            const yr = mod(lambda * (this.x - xr) - this.y);
            return new CurvePoint(xr, yr);
        } else {
            // Chord: lambda = (y2 - y1) / (x2 - x1)
            const lambda = mod(mod(q.y - this.y) * modInverse(mod(q.x - this.x)));
            const xr = mod(lambda * lambda - this.x - q.x);
            const yr = mod(lambda * (this.x - xr) - this.y);
            return new CurvePoint(xr, yr);
        }
    }
    multiply(k) {
        let n = mod(k, SECP256K1_N);
        let r = CurvePoint.infinity();
        let base = this;
        while (n > 0n) {
            if (n & 1n) r = r.add(base);
            base = base.add(base);
            n >>= 1n;
        }
        return r;
    }
}

const G_POINT = new CurvePoint(SECP256K1_GX, SECP256K1_GY);

// -------------------------------------------------------------------------
// Helper Hex & Byte Functions
// -------------------------------------------------------------------------

function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
    if (hex.startsWith('0x')) hex = hex.slice(2);
    if (hex.length % 2 !== 0) hex = '0' + hex;
    const len = hex.length / 2;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

// -------------------------------------------------------------------------
// WebCrypto API Wrappers
// -------------------------------------------------------------------------

async function sha256Digest(data) {
    if (typeof data === 'string') data = new TextEncoder().encode(data);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hash);
}

async function pbkdf2HmacSha512(password, salt, iterations, keyLengthBytes) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    const derived = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            hash: 'SHA-512',
            salt: enc.encode(salt),
            iterations: iterations
        },
        keyMaterial,
        keyLengthBytes * 8
    );
    return new Uint8Array(derived);
}

async function hmacSha512(keyBytes, dataBytes) {
    if (typeof keyBytes === 'string') keyBytes = new TextEncoder().encode(keyBytes);
    if (typeof dataBytes === 'string') dataBytes = new TextEncoder().encode(dataBytes);
    const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, dataBytes);
    return new Uint8Array(sig);
}

// -------------------------------------------------------------------------
// BIP-39 Implementation
// -------------------------------------------------------------------------

async function generateMnemonic(entropyBits = 128) {
    const entropy = new Uint8Array(entropyBits / 8);
    crypto.getRandomValues(entropy);
    return await entropyToMnemonic(entropy);
}

async function entropyToMnemonic(entropyBytes) {
    const entLen = entropyBytes.length * 8; // e.g. 128
    const csLen = entLen / 32; // 4 bits for 128-bit
    const hash = await sha256Digest(entropyBytes);
    
    // Combine entropy bits + checksum bits
    let bits = '';
    for (let i = 0; i < entropyBytes.length; i++) {
        bits += entropyBytes[i].toString(2).padStart(8, '0');
    }
    const hashBits = hash[0].toString(2).padStart(8, '0');
    bits += hashBits.slice(0, csLen);

    // Group into 11-bit chunks
    const words = [];
    for (let i = 0; i < bits.length; i += 11) {
        const index = parseInt(bits.slice(i, i + 11), 2);
        words.push(BIP39_WORDLIST[index]);
    }
    return {
        entropyHex: bytesToHex(entropyBytes),
        checksumBits: hashBits.slice(0, csLen),
        words: words,
        phrase: words.join(' ')
    };
}

async function validateMnemonic(phrase) {
    const words = phrase.trim().toLowerCase().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
        return { valid: false, reason: 'Mnemonic must be exactly 12 or 24 words.' };
    }
    for (const w of words) {
        if (!BIP39_WORDLIST.includes(w)) {
            return { valid: false, reason: `Word "${w}" is not in the standard BIP-39 wordlist.` };
        }
    }
    // Checksum verification
    let bits = '';
    for (const w of words) {
        const idx = BIP39_WORDLIST.indexOf(w);
        bits += idx.toString(2).padStart(11, '0');
    }
    const csLen = words.length / 3;
    const entLen = bits.length - csLen;
    const entropyBits = bits.slice(0, entLen);
    const checksumBits = bits.slice(entLen);

    const entropyBytes = new Uint8Array(entLen / 8);
    for (let i = 0; i < entLen; i += 8) {
        entropyBytes[i / 8] = parseInt(entropyBits.slice(i, i + 8), 2);
    }
    const hash = await sha256Digest(entropyBytes);
    const expectedCs = hash[0].toString(2).padStart(8, '0').slice(0, csLen);

    if (checksumBits !== expectedCs) {
        return { valid: false, reason: 'Invalid BIP-39 checksum! One or more words may be mistyped.' };
    }
    return { valid: true, entropyHex: bytesToHex(entropyBytes), words: words };
}

// -------------------------------------------------------------------------
// BIP-32 & BIP-44 Hierarchical Deterministic Key Derivation
// -------------------------------------------------------------------------

function getCompressedPubKey(privBytes) {
    const privBig = BigInt('0x' + bytesToHex(privBytes));
    const pt = G_POINT.multiply(privBig);
    const prefix = (pt.y % 2n === 0n) ? 0x02 : 0x03;
    const res = new Uint8Array(33);
    res[0] = prefix;
    const xHex = pt.x.toString(16).padStart(64, '0');
    for (let i = 0; i < 32; i++) res[1 + i] = parseInt(xHex.substr(i * 2, 2), 16);
    return res;
}

async function deriveBIP32Child(parentPriv, parentCc, index) {
    const isHardened = index >= 0x80000000;
    const data = new Uint8Array(37);
    if (isHardened) {
        data[0] = 0x00;
        data.set(parentPriv, 1);
    } else {
        const pub = getCompressedPubKey(parentPriv);
        data.set(pub, 0);
    }
    new DataView(data.buffer).setUint32(33, index, false);
    const hmac = await hmacSha512(parentCc, data);
    const il = hmac.subarray(0, 32);
    const ir = hmac.subarray(32, 64);
    const childPrivBig = mod(BigInt('0x' + bytesToHex(parentPriv)) + BigInt('0x' + bytesToHex(il)), SECP256K1_N);
    const childHex = childPrivBig.toString(16).padStart(64, '0');
    const childPriv = hexToBytes(childHex);
    return { priv: childPriv, cc: ir };
}

async function derivePath(masterPriv, masterCc, pathStr) {
    // pathStr: e.g. "m/44'/60'/0'/0/0"
    const segments = pathStr.split('/').slice(1);
    let cur = { priv: masterPriv, cc: masterCc };
    for (const seg of segments) {
        let index = 0;
        if (seg.endsWith("'") || seg.endsWith("h")) {
            index = parseInt(seg.slice(0, -1), 10) + 0x80000000;
        } else {
            index = parseInt(seg, 10);
        }
        cur = await deriveBIP32Child(cur.priv, cur.cc, index);
    }
    return cur;
}

// -------------------------------------------------------------------------
// Ethereum Address & EIP-55 Checksum
// -------------------------------------------------------------------------

function privateKeyToPublicKey(privBytes) {
    const privBig = BigInt('0x' + bytesToHex(privBytes));
    const pt = G_POINT.multiply(privBig);
    const xHex = pt.x.toString(16).padStart(64, '0');
    const yHex = pt.y.toString(16).padStart(64, '0');
    return {
        pt: pt,
        xHex: xHex,
        yHex: yHex,
        uncompressedHex: xHex + yHex,
        uncompressedBytes: hexToBytes(xHex + yHex)
    };
}

function publicKeyToAddress(uncompressedPubHex) {
    const hash = keccak256(uncompressedPubHex);
    const hashHex = bytesToHex(hash);
    const rawAddress = hashHex.slice(24); // last 20 bytes = 40 hex characters
    return {
        hashHex: hashHex,
        rawAddress: '0x' + rawAddress
    };
}

function toChecksumAddress(address) {
    const clean = address.toLowerCase().replace(/^0x/, '');
    const hash = bytesToHex(keccak256(new TextEncoder().encode(clean)));
    let ret = '0x';
    const breakdown = [];
    for (let i = 0; i < clean.length; i++) {
        const char = clean[i];
        const nibbleVal = parseInt(hash[i], 16);
        const shouldUpper = (nibbleVal >= 8 && /[a-f]/.test(char));
        const finalChar = shouldUpper ? char.toUpperCase() : char;
        ret += finalChar;
        breakdown.push({
            index: i,
            origChar: char,
            hashNibble: hash[i],
            nibbleVal: nibbleVal,
            capitalized: shouldUpper,
            finalChar: finalChar
        });
    }
    return {
        checksumAddress: ret,
        hashHex: hash,
        breakdown: breakdown
    };
}

function verifyChecksum(address) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
        return { valid: false, reason: 'Invalid address format (must be 0x followed by 40 hex characters).' };
    }
    const clean = address.replace(/^0x/, '');
    const expected = toChecksumAddress(clean).checksumAddress.replace(/^0x/, '');
    const isChecksummed = clean !== clean.toLowerCase() && clean !== clean.toUpperCase();
    if (clean === expected) {
        return { valid: true, isChecksummed: true, reason: 'Valid EIP-55 Checksum! Address passes integrity check.' };
    } else if (clean === clean.toLowerCase()) {
        return { valid: true, isChecksummed: false, reason: 'All-lowercase address. Valid format, but no EIP-55 checksum protection.' };
    } else {
        return { valid: false, isChecksummed: false, reason: 'Checksum mismatch! Typo detected in address capitalization or digits.' };
    }
}

// -------------------------------------------------------------------------
// Pipeline Execution Orchestrator
// -------------------------------------------------------------------------

let currentPipelineData = null;

async function executeFullPipeline(mnemonicPhrase, passphrase = "", pathStr = "m/44'/60'/0'/0/0") {
    // 1. Validate Mnemonic
    const validRes = await validateMnemonic(mnemonicPhrase);
    if (!validRes.valid) {
        throw new Error(validRes.reason);
    }

    // 2. BIP-39 Seed Derivation via PBKDF2-HMAC-SHA512
    const seedBytes = await pbkdf2HmacSha512(mnemonicPhrase, "mnemonic" + passphrase, 2048, 64);
    const seedHex = bytesToHex(seedBytes);

    // 3. BIP-32 Master Extended Key
    const masterHmac = await hmacSha512("Bitcoin seed", seedBytes);
    const masterPriv = masterHmac.subarray(0, 32);
    const masterCc = masterHmac.subarray(32, 64);

    // 4. BIP-44 Child Key Derivation
    const derived = await derivePath(masterPriv, masterCc, pathStr);
    const childPrivHex = bytesToHex(derived.priv);
    const childCcHex = bytesToHex(derived.cc);

    // 5. secp256k1 Public Key
    const pubKey = privateKeyToPublicKey(derived.priv);

    // 6. Keccak-256 Hashing & Address
    const addrObj = publicKeyToAddress(pubKey.uncompressedHex);

    // 7. EIP-55 Checksum
    const checksumObj = toChecksumAddress(addrObj.rawAddress);

    currentPipelineData = {
        mnemonicPhrase,
        words: mnemonicPhrase.trim().split(/\s+/),
        passphrase,
        pathStr,
        seedHex,
        masterPrivHex: bytesToHex(masterPriv),
        masterCcHex: bytesToHex(masterCc),
        childPrivHex,
        childCcHex,
        pubKey,
        addrObj,
        checksumObj
    };

    return currentPipelineData;
}

// -------------------------------------------------------------------------
// Statistical Computations & Helpers
// -------------------------------------------------------------------------

/**
 * Computes Hamming Distance between two Uint8Arrays
 */
function computeHammingDistance(bufA, bufB) {
    const len = Math.min(bufA.length, bufB.length);
    let diffBits = 0;
    for (let i = 0; i < len; i++) {
        let xor = bufA[i] ^ bufB[i];
        while (xor > 0) {
            diffBits += (xor & 1);
            xor >>= 1;
        }
    }
    return diffBits;
}

/**
 * Wilson-Hilferty Approximation for Chi-Square p-value
 */
function chiSquarePValue(chiSq, df) {
    if (chiSq <= 0) return 1.0;
    const term1 = Math.pow(chiSq / df, 1/3);
    const term2 = 1 - (2 / (9 * df));
    const term3 = Math.sqrt(2 / (9 * df));
    const z = (term1 - term2) / term3;
    return 0.5 * erfc(z / Math.SQRT2);
}

function erfc(x) {
    const z = Math.abs(x);
    const t = 1.0 / (1.0 + 0.5 * z);
    const ans = t * Math.exp(-z * z - 1.26551223 +
        t * (1.00002368 +
        t * (0.37409196 +
        t * (0.09678418 +
        t * (-0.18628806 +
        t * (0.27886807 +
        t * (-1.13520398 +
        t * (1.48851587 +
        t * (-0.82215223 +
        t * 0.17087277)))))))));
    return x >= 0 ? ans : 2.0 - ans;
}

/**
 * Binomial PMF: n = 256, p = 0.5
 */
function binomialPMF(n, k, p = 0.5) {
    // Normal approximation for n=256, p=0.5: mu = 128, sigma = 8
    const mu = n * p;
    const sigma = Math.sqrt(n * p * (1 - p));
    const z = (k - mu) / sigma;
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
}

// -------------------------------------------------------------------------
// Canvas Chart Renderers
// -------------------------------------------------------------------------

/**
 * Render 256-bit Grid Visualizer for Avalanche Effect
 */
function renderAvalancheCanvas(canvasId, originalHashBytes, flippedHashBytes) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // 16x16 grid for 256 bits
    const cols = 16;
    const rows = 16;
    const pad = 3;
    const cellW = (width - pad * (cols + 1)) / cols;
    const cellH = (height - pad * (rows + 1)) / rows;

    let flippedCount = 0;

    for (let i = 0; i < 256; i++) {
        const byteIdx = Math.floor(i / 8);
        const bitIdx = 7 - (i % 8);

        const b1 = (originalHashBytes[byteIdx] >> bitIdx) & 1;
        const b2 = (flippedHashBytes[byteIdx] >> bitIdx) & 1;
        const isFlipped = (b1 !== b2);
        if (isFlipped) flippedCount++;

        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = pad + col * (cellW + pad);
        const y = pad + row * (cellH + pad);

        ctx.beginPath();
        ctx.roundRect(x, y, cellW, cellH, 3);
        if (isFlipped) {
            ctx.fillStyle = '#f43f5e'; // Vibrant rose for flipped
        } else {
            ctx.fillStyle = '#1e293b'; // Slate dark for unchanged
        }
        ctx.fill();

        // Subtle border
        ctx.strokeStyle = isFlipped ? '#fb7185' : '#334155';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    return flippedCount;
}

/**
 * Render Monte Carlo Histogram for Avalanche Trials
 */
function renderMonteCarloCanvas(canvasId, distributionCounts, totalTrials) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const margin = { top: 30, right: 30, bottom: 45, left: 45 };
    const chartW = w - margin.left - margin.right;
    const chartH = h - margin.top - margin.bottom;

    // Range of 관심: 90 to 166 bits (around mean 128)
    const minBit = 96;
    const maxBit = 160;
    const numBins = maxBit - minBit + 1;
    const binW = chartW / numBins;

    // Find max frequency
    let maxFreq = 0.05;
    for (let k = minBit; k <= maxBit; k++) {
        const freq = (distributionCounts[k] || 0) / totalTrials;
        if (freq > maxFreq) maxFreq = freq;
        const theo = binomialPMF(256, k);
        if (theo > maxFreq) maxFreq = theo;
    }
    maxFreq *= 1.15; // padding

    // Draw horizontal grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let step = 0; step <= 5; step++) {
        const yVal = margin.top + (chartH / 5) * step;
        ctx.beginPath();
        ctx.moveTo(margin.left, yVal);
        ctx.lineTo(margin.left + chartW, yVal);
        ctx.stroke();

        const label = ((maxFreq * (5 - step) / 5) * 100).toFixed(1) + '%';
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(label, margin.left - 8, yVal + 3);
    }

    // Draw Bars (Empirical)
    for (let k = minBit; k <= maxBit; k++) {
        const count = distributionCounts[k] || 0;
        const freq = count / totalTrials;
        const barH = (freq / maxFreq) * chartH;
        const x = margin.left + (k - minBit) * binW;
        const y = margin.top + chartH - barH;

        ctx.fillStyle = 'rgba(56, 189, 248, 0.7)'; // Sky cyan
        ctx.fillRect(x + 1, y, Math.max(1, binW - 2), barH);
    }

    // Draw Theoretical Binomial Curve Line
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b'; // Amber curve
    ctx.lineWidth = 2.5;
    for (let k = minBit; k <= maxBit; k++) {
        const theo = binomialPMF(256, k);
        const y = margin.top + chartH - (theo / maxFreq) * chartH;
        const x = margin.left + (k - minBit + 0.5) * binW;
        if (k === minBit) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Center vertical line at Mean = 128
    const meanX = margin.left + (128 - minBit + 0.5) * binW;
    ctx.strokeStyle = '#10b981';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(meanX, margin.top);
    ctx.lineTo(meanX, margin.top + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Hamming Distance (Bits Flipped)', margin.left + chartW / 2, h - 10);
    ctx.fillText('μ = 128 (50%)', meanX, margin.top - 8);

    // Legend
    ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.fillRect(margin.left + chartW - 170, margin.top + 5, 12, 10);
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.fillText('Empirical Trials', margin.left + chartW - 152, margin.top + 14);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left + chartW - 170, margin.top + 28);
    ctx.lineTo(margin.left + chartW - 158, margin.top + 28);
    ctx.stroke();
    ctx.fillText('Theoretical B(256, 0.5)', margin.left + chartW - 152, margin.top + 31);
}

/**
 * Render Uniformity Bar Chart & Chi-Square Fit
 */
function renderUniformityCanvas(canvasId, hexCounts, totalNibbles, chiSq, pVal) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const margin = { top: 35, right: 25, bottom: 45, left: 55 };
    const chartW = w - margin.left - margin.right;
    const chartH = h - margin.top - margin.bottom;

    const expected = totalNibbles / 16;
    let maxCount = expected * 1.4;
    for (let i = 0; i < 16; i++) {
        if (hexCounts[i] > maxCount) maxCount = hexCounts[i] * 1.1;
    }

    const barW = chartW / 16;

    // Draw horizontal grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let step = 0; step <= 4; step++) {
        const y = margin.top + (chartH / 4) * step;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + chartW, y);
        ctx.stroke();

        const countVal = Math.round(maxCount * (4 - step) / 4);
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(countVal.toLocaleString(), margin.left - 8, y + 3);
    }

    // Expected level line
    const expY = margin.top + chartH - (expected / maxCount) * chartH;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(margin.left, expY);
    ctx.lineTo(margin.left + chartW, expY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw bars
    const hexChars = '0123456789abcdef';
    for (let i = 0; i < 16; i++) {
        const count = hexCounts[i];
        const barH = (count / maxCount) * chartH;
        const x = margin.left + i * barW;
        const y = margin.top + chartH - barH;

        // Gradient
        const grad = ctx.createLinearGradient(0, y, 0, margin.top + chartH);
        grad.addColorStop(0, '#6366f1');
        grad.addColorStop(1, '#3b82f6');
        ctx.fillStyle = grad;
        ctx.fillRect(x + 4, y, barW - 8, barH);

        // Character label
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(hexChars[i].toUpperCase(), x + barW / 2, h - 22);
    }

    // Stats banner inside canvas
    ctx.fillStyle = '#10b981';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Expected: ${expected.toFixed(0)} | Observed χ² = ${chiSq.toFixed(2)} (df=15) | p-value = ${pVal.toFixed(4)}`, margin.left, 22);
    
    // Status
    const pass = (pVal >= 0.05);
    ctx.fillStyle = pass ? '#10b981' : '#f43f5e';
    ctx.textAlign = 'right';
    ctx.fillText(pass ? '✓ Uniformity Hypothesis Accepted (p > 0.05)' : '✗ Significant Bias Detected', w - margin.right, 22);
}

/**
 * Render Birthday Paradox Collision Curve
 */
function renderBirthdayCanvas(canvasId, selectedBits = 32, currentK = 50000) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const margin = { top: 30, right: 30, bottom: 45, left: 60 };
    const chartW = w - margin.left - margin.right;
    const chartH = h - margin.top - margin.bottom;

    // N = 2^bits
    // 50% collision point: k_half = 1.1774 * 2^(bits/2)
    const kHalf = 1.17741 * Math.pow(2, selectedBits / 2);
    const maxK = kHalf * 2.5;

    // Draw horizontal grid lines (0%, 25%, 50%, 75%, 100%)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = margin.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + chartW, y);
        ctx.stroke();

        const pct = (100 - i * 25) + '%';
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(pct, margin.left - 8, y + 4);
    }

    // 50% Threshold Line
    const y50 = margin.top + chartH * 0.5;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(margin.left, y50);
    ctx.lineTo(margin.left + chartW, y50);
    ctx.stroke();
    ctx.setLineDash([]);

    // Curve function: P(k) = 1 - exp(-k^2 / (2 * 2^bits))
    const N = Math.pow(2, selectedBits);
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;

    const points = 100;
    for (let i = 0; i <= points; i++) {
        const k = (i / points) * maxK;
        const exponent = -(k * k) / (2 * N);
        const prob = 1 - Math.exp(exponent);
        const x = margin.left + (i / points) * chartW;
        const y = margin.top + chartH - prob * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Mark 50% point
    const x50 = margin.left + (kHalf / maxK) * chartW;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x50, y50, 5, 0, Math.PI * 2);
    ctx.fill();

    // Current K point
    const curKRatio = Math.min(1.0, currentK / maxK);
    const curExp = -(currentK * currentK) / (2 * N);
    const curProb = 1 - Math.exp(curExp);
    const curX = margin.left + curKRatio * chartW;
    const curY = margin.top + chartH - curProb * chartH;

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(curX, curY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Legend & Info
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Space: 2^${selectedBits} | 50% collision at k ≈ ${Math.round(kHalf).toLocaleString()} samples`, margin.left, 18);
    ctx.fillText(`Current: k = ${Math.round(currentK).toLocaleString()} → P(collision) = ${(curProb * 100).toFixed(4)}%`, margin.left + chartW - 250, 18);

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('Number of Generated Items (k)', margin.left + chartW / 2, h - 10);
}

/**
 * Render secp256k1 Elliptic Curve Geometric Visualization over Real Numbers
 * y^2 = x^3 + 7
 */
function renderCurveCanvas(canvasId, currentMultiplier = 2) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Coordinate system: X in [-3, 5], Y in [-6, 6]
    const xMin = -3.0, xMax = 5.0;
    const yMin = -6.0, yMax = 6.0;

    const toCanvasX = (x) => ((x - xMin) / (xMax - xMin)) * w;
    const toCanvasY = (y) => h - ((y - yMin) / (yMax - yMin)) * h;

    // Draw Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    // X Axis (y = 0)
    const y0 = toCanvasY(0);
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.lineTo(w, y0);
    ctx.stroke();

    // Y Axis (x = 0)
    const x0 = toCanvasX(0);
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    ctx.lineTo(x0, h);
    ctx.stroke();

    // Plot Weierstrass curve y^2 = x^3 + 7
    // Root of x^3 + 7 = 0 is x = -7^(1/3) ≈ -1.91293
    const xRoot = -Math.cbrt(7);

    // Upper and lower branches
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;

    // Upper branch y = +sqrt(x^3 + 7)
    ctx.beginPath();
    let started = false;
    for (let px = 0; px <= w; px += 2) {
        const x = xMin + (px / w) * (xMax - xMin);
        if (x >= xRoot) {
            const y = Math.sqrt(x * x * x + 7);
            const py = toCanvasY(y);
            if (!started) {
                ctx.moveTo(px, py);
                started = true;
            } else {
                ctx.lineTo(px, py);
            }
        }
    }
    ctx.stroke();

    // Lower branch y = -sqrt(x^3 + 7)
    ctx.beginPath();
    started = false;
    for (let px = 0; px <= w; px += 2) {
        const x = xMin + (px / w) * (xMax - xMin);
        if (x >= xRoot) {
            const y = -Math.sqrt(x * x * x + 7);
            const py = toCanvasY(y);
            if (!started) {
                ctx.moveTo(px, py);
                started = true;
            } else {
                ctx.lineTo(px, py);
            }
        }
    }
    ctx.stroke();

    // Let's pick base point P on the curve: e.g. x1 = -1, y1 = sqrt(6) ≈ 2.449
    const Px = -1.0;
    const Py = Math.sqrt(Px * Px * Px + 7);

    // Point Doubling 2P = P + P:
    // Slope lambda = (3 * x1^2) / (2 * y1)
    const lambda = (3 * Px * Px) / (2 * Py);
    const x2 = lambda * lambda - 2 * Px;
    const yInter = lambda * (Px - x2) - Py; // -2P y-coord
    const y2 = -yInter; // Reflection across x-axis

    // Draw Tangent Line at P
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const tXstart = -2.5;
    const tXend = 4.5;
    ctx.moveTo(toCanvasX(tXstart), toCanvasY(Py + lambda * (tXstart - Px)));
    ctx.lineTo(toCanvasX(tXend), toCanvasY(Py + lambda * (tXend - Px)));
    ctx.stroke();

    // Draw reflection vertical line at 2P
    ctx.strokeStyle = '#10b981';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(x2), toCanvasY(yInter));
    ctx.lineTo(toCanvasX(x2), toCanvasY(y2));
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Points
    function drawPoint(x, y, label, color) {
        const cx = toCanvasX(x);
        const cy = toCanvasY(y);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(label, cx + 10, cy - 8);
    }

    drawPoint(Px, Py, 'P (Generator G)', '#38bdf8');
    drawPoint(x2, yInter, 'P * P intersection', '#64748b');
    drawPoint(x2, y2, '2P = P + P (Reflected)', '#10b981');

    // Title info
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Weierstrass Equation: y² = x³ + 7 over ℝ (Geometric Group Law Demonstration)', 15, 20);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Tangent at P intersects curve; reflected across X-axis to yield 2P. Repeating enables double-and-add scalar multiplication.', 15, 38);
}

// -------------------------------------------------------------------------
// UI Controller & Event Binding
// -------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial Default Run with standard mnemonic
    const defaultMnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    const mnemonicInput = document.getElementById('mnemonic-input');
    const passphraseInput = document.getElementById('passphrase-input');
    const accountIndexInput = document.getElementById('account-index-input');

    if (mnemonicInput) mnemonicInput.value = defaultMnemonic;

    async function updatePipelineUI() {
        const phrase = mnemonicInput ? mnemonicInput.value.trim() : defaultMnemonic;
        const pass = passphraseInput ? passphraseInput.value : "";
        const idx = accountIndexInput ? parseInt(accountIndexInput.value, 10) || 0 : 0;
        const path = `m/44'/60'/0'/0/${idx}`;

        const statusEl = document.getElementById('pipeline-status');
        if (statusEl) {
            statusEl.innerHTML = '<span class="spinner"></span> Deriving cryptographic stages...';
            statusEl.className = 'status-msg loading';
        }

        try {
            const data = await executeFullPipeline(phrase, pass, path);

            // Update UI elements
            setText('display-entropy', data.mnemonicPhrase ? (data.words.length + ' words (' + (data.words.length === 12 ? '128' : '256') + ' bits entropy)') : '');
            setText('display-seed', data.seedHex);
            setText('display-master-priv', data.masterPrivHex);
            setText('display-master-cc', data.masterCcHex);
            setText('display-child-path', data.pathStr);
            setText('display-child-priv', data.childPrivHex);
            setText('display-pub-x', data.pubKey.xHex);
            setText('display-pub-y', data.pubKey.yHex);
            setText('display-uncompressed-pub', data.pubKey.uncompressedHex);
            setText('display-keccak-pub', data.addrObj.hashHex);
            setText('display-raw-address', data.addrObj.rawAddress);
            setText('display-checksum-address', data.checksumObj.checksumAddress);

            // Render Mnemonic Word Chips
            const chipContainer = document.getElementById('mnemonic-chips');
            if (chipContainer) {
                chipContainer.innerHTML = '';
                data.words.forEach((word, i) => {
                    const span = document.createElement('span');
                    span.className = 'word-chip';
                    span.innerHTML = `<small>${i + 1}</small> ${word}`;
                    chipContainer.appendChild(span);
                });
            }

            // Render EIP-55 Character Breakdown
            renderEIP55Breakdown(data.checksumObj.breakdown);

            // Also update Address in Typo Sandbox
            const typoInput = document.getElementById('typo-test-address');
            if (typoInput) {
                typoInput.value = data.checksumObj.checksumAddress;
                testTypoAddress();
            }

            if (statusEl) {
                statusEl.innerHTML = '✓ Pipeline successfully derived! Address matches Ethereum standard.';
                statusEl.className = 'status-msg success';
            }
        } catch (err) {
            if (statusEl) {
                statusEl.innerHTML = `✗ Error: ${err.message}`;
                statusEl.className = 'status-msg error';
            }
        }
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function renderEIP55Breakdown(breakdown) {
        const container = document.getElementById('eip55-breakdown-container');
        if (!container) return;
        container.innerHTML = '';

        breakdown.forEach(item => {
            const charBox = document.createElement('div');
            charBox.className = 'eip-char-box ' + (item.capitalized ? 'capitalized' : 'lowercase');
            charBox.innerHTML = `
                <div class="final-char">${item.finalChar}</div>
                <div class="hash-nibble">${item.hashNibble}</div>
                <div class="nibble-badge">${item.nibbleVal >= 8 ? '≥8 (UPPER)' : '<8 (lower)'}</div>
            `;
            container.appendChild(charBox);
        });
    }

    // Attach Pipeline Listeners
    if (mnemonicInput) mnemonicInput.addEventListener('input', updatePipelineUI);
    if (passphraseInput) passphraseInput.addEventListener('input', updatePipelineUI);
    if (accountIndexInput) accountIndexInput.addEventListener('input', updatePipelineUI);

    const btnGenerateRandom = document.getElementById('btn-generate-random');
    if (btnGenerateRandom) {
        btnGenerateRandom.addEventListener('click', async () => {
            const m = await generateMnemonic(128);
            if (mnemonicInput) mnemonicInput.value = m.phrase;
            updatePipelineUI();
        });
    }

    const btnLoadTestVector = document.getElementById('btn-load-test-vector');
    if (btnLoadTestVector) {
        btnLoadTestVector.addEventListener('click', () => {
            if (mnemonicInput) mnemonicInput.value = defaultMnemonic;
            if (passphraseInput) passphraseInput.value = "";
            if (accountIndexInput) accountIndexInput.value = 0;
            updatePipelineUI();
        });
    }

    const btnPrevAccount = document.getElementById('btn-prev-account');
    const btnNextAccount = document.getElementById('btn-next-account');
    if (btnPrevAccount && accountIndexInput) {
        btnPrevAccount.addEventListener('click', () => {
            let val = parseInt(accountIndexInput.value, 10) || 0;
            if (val > 0) accountIndexInput.value = val - 1;
            updatePipelineUI();
        });
    }
    if (btnNextAccount && accountIndexInput) {
        btnNextAccount.addEventListener('click', () => {
            let val = parseInt(accountIndexInput.value, 10) || 0;
            accountIndexInput.value = val + 1;
            updatePipelineUI();
        });
    }

    // -------------------------------------------------------------------------
    // EIP-55 Typo Detection Sandbox
    // -------------------------------------------------------------------------
    const typoInput = document.getElementById('typo-test-address');
    const typoStatus = document.getElementById('typo-test-status');

    function testTypoAddress() {
        if (!typoInput || !typoStatus) return;
        const val = typoInput.value.trim();
        const res = verifyChecksum(val);
        if (res.valid) {
            if (res.isChecksummed) {
                typoStatus.className = 'typo-box valid';
                typoStatus.innerHTML = `<strong>VALID EIP-55 CHECKSUM</strong><p>${res.reason}</p>`;
            } else {
                typoStatus.className = 'typo-box unchecksummed';
                typoStatus.innerHTML = `<strong>UNCHECKSUMMED ADDRESS</strong><p>${res.reason}</p>`;
            }
        } else {
            typoStatus.className = 'typo-box invalid';
            typoStatus.innerHTML = `<strong>CHECKSUM FAILED (TYPO DETECTED)</strong><p>${res.reason}</p>`;
        }
    }

    if (typoInput) typoInput.addEventListener('input', testTypoAddress);

    const btnFlipOneChar = document.getElementById('btn-flip-one-char');
    if (btnFlipOneChar && typoInput) {
        btnFlipOneChar.addEventListener('click', () => {
            let addr = typoInput.value.replace(/^0x/, '');
            if (addr.length === 40) {
                // Pick random index between 0 and 39
                const idx = Math.floor(Math.random() * 40);
                const char = addr[idx];
                let newChar;
                if (/[a-f]/.test(char)) {
                    newChar = char.toUpperCase();
                } else if (/[A-F]/.test(char)) {
                    newChar = char.toLowerCase();
                } else {
                    newChar = ((parseInt(char, 10) + 1) % 10).toString();
                }
                addr = addr.substr(0, idx) + newChar + addr.substr(idx + 1);
                typoInput.value = '0x' + addr;
                testTypoAddress();
            }
        });
    }

    const btnResetTypo = document.getElementById('btn-reset-typo');
    if (btnResetTypo && typoInput) {
        btnResetTypo.addEventListener('click', () => {
            if (currentPipelineData) {
                typoInput.value = currentPipelineData.checksumObj.checksumAddress;
                testTypoAddress();
            }
        });
    }

    // -------------------------------------------------------------------------
    // Avalanche Effect Interactive Demo
    // -------------------------------------------------------------------------
    const avalancheInputA = document.getElementById('avalanche-input-a');
    const avalancheInputB = document.getElementById('avalanche-input-b');
    const btnFlipOneBit = document.getElementById('btn-flip-one-bit');
    const avalancheStats = document.getElementById('avalanche-stats');

    function updateAvalanche() {
        const textA = avalancheInputA ? avalancheInputA.value : "Ethereum 2026";
        const textB = avalancheInputB ? avalancheInputB.value : "Ethereum 2027";

        const hashA = keccak256(textA);
        const hashB = keccak256(textB);

        setText('avalanche-hash-a', bytesToHex(hashA));
        setText('avalanche-hash-b', bytesToHex(hashB));

        const flippedCount = renderAvalancheCanvas('canvas-avalanche-grid', hashA, hashB);
        const pct = ((flippedCount / 256) * 100).toFixed(2);

        if (avalancheStats) {
            avalancheStats.innerHTML = `
                <div>Bits Flipped: <strong>${flippedCount} / 256</strong></div>
                <div>Difference: <strong>${pct}%</strong> (Ideal Strict Avalanche Criterion: 50.00%)</div>
            `;
        }
    }

    if (avalancheInputA) avalancheInputA.addEventListener('input', updateAvalanche);
    if (avalancheInputB) avalancheInputB.addEventListener('input', updateAvalanche);

    if (btnFlipOneBit && avalancheInputA && avalancheInputB) {
        btnFlipOneBit.addEventListener('click', () => {
            const raw = new TextEncoder().encode(avalancheInputA.value || "Ethereum");
            const modified = new Uint8Array(raw);
            if (modified.length > 0) {
                // Flip lowest bit of first byte
                modified[0] ^= 1;
                // Decode or hex represent
                let str = "";
                for (let i = 0; i < modified.length; i++) {
                    str += String.fromCharCode(modified[i]);
                }
                avalancheInputB.value = str;
                updateAvalanche();
            }
        });
    }

    // Monte Carlo Simulation for Avalanche
    const btnRunMonteCarlo = document.getElementById('btn-run-monte-carlo');
    if (btnRunMonteCarlo) {
        btnRunMonteCarlo.addEventListener('click', async () => {
            btnRunMonteCarlo.disabled = true;
            btnRunMonteCarlo.textContent = 'Running 500 Trials...';

            const trials = 500;
            const dist = {};
            const baseInput = new Uint8Array(32);
            crypto.getRandomValues(baseInput);
            const baseHash = keccak256(baseInput);

            for (let t = 0; t < trials; t++) {
                const sampleInput = new Uint8Array(baseInput);
                // Flip random bit
                const randomByte = Math.floor(Math.random() * 32);
                const randomBit = Math.floor(Math.random() * 8);
                sampleInput[randomByte] ^= (1 << randomBit);

                const sampleHash = keccak256(sampleInput);
                const diff = computeHammingDistance(baseHash, sampleHash);
                dist[diff] = (dist[diff] || 0) + 1;

                if (t % 50 === 0) {
                    renderMonteCarloCanvas('canvas-monte-carlo', dist, t + 1);
                    await new Promise(r => setTimeout(r, 5));
                }
            }

            renderMonteCarloCanvas('canvas-monte-carlo', dist, trials);
            btnRunMonteCarlo.disabled = false;
            btnRunMonteCarlo.textContent = 'Run 500 Bit-Flip Trials Again';
        });
    }

    // -------------------------------------------------------------------------
    // Uniformity & Chi-Square Test
    // -------------------------------------------------------------------------
    const btnRunUniformity = document.getElementById('btn-run-uniformity');
    const uniformitySampleSize = document.getElementById('uniformity-sample-size');

    async function runUniformityTest() {
        const samples = uniformitySampleSize ? parseInt(uniformitySampleSize.value, 10) || 500 : 500;
        if (btnRunUniformity) {
            btnRunUniformity.disabled = true;
            btnRunUniformity.textContent = `Generating ${samples} Hashes...`;
        }

        const counts = new Array(16).fill(0);
        let totalNibbles = samples * 64; // 32 bytes = 64 hex nibbles per hash

        for (let i = 0; i < samples; i++) {
            const buf = new Uint8Array(16);
            new DataView(buf.buffer).setUint32(0, i);
            const hash = keccak256(buf);
            for (let b = 0; b < 32; b++) {
                counts[hash[b] >> 4]++;
                counts[hash[b] & 0x0F]++;
            }
        }

        const expected = totalNibbles / 16;
        let chiSq = 0;
        for (let i = 0; i < 16; i++) {
            const diff = counts[i] - expected;
            chiSq += (diff * diff) / expected;
        }
        const pVal = chiSquarePValue(chiSq, 15);

        renderUniformityCanvas('canvas-uniformity', counts, totalNibbles, chiSq, pVal);

        if (btnRunUniformity) {
            btnRunUniformity.disabled = false;
            btnRunUniformity.textContent = 'Run Chi-Square Test';
        }
    }

    if (btnRunUniformity) btnRunUniformity.addEventListener('click', runUniformityTest);
    if (uniformitySampleSize) uniformitySampleSize.addEventListener('change', runUniformityTest);

    // -------------------------------------------------------------------------
    // Birthday Paradox Interactive Curve
    // -------------------------------------------------------------------------
    const birthdaySlider = document.getElementById('birthday-slider');
    const birthdayBitSelect = document.getElementById('birthday-bit-select');

    function updateBirthdayUI() {
        const bits = birthdayBitSelect ? parseInt(birthdayBitSelect.value, 10) || 32 : 32;
        const kHalf = 1.17741 * Math.pow(2, bits / 2);
        const maxK = kHalf * 2.5;

        const sliderVal = birthdaySlider ? parseFloat(birthdaySlider.value) / 100 : 0.4;
        const curK = sliderVal * maxK;

        renderBirthdayCanvas('canvas-birthday', bits, curK);
    }

    if (birthdaySlider) birthdaySlider.addEventListener('input', updateBirthdayUI);
    if (birthdayBitSelect) birthdayBitSelect.addEventListener('change', updateBirthdayUI);

    // -------------------------------------------------------------------------
    // Hash Comparison Lab (Keccak-256 vs SHA3-256 vs SHA-256 vs SHA-512)
    // -------------------------------------------------------------------------
    const hashLabInput = document.getElementById('hash-lab-input');
    async function updateHashLab() {
        const text = hashLabInput ? hashLabInput.value : "Ethereum Foundation";
        const k256 = bytesToHex(keccak256(text));
        const s3_256 = bytesToHex(sha3_256(text));
        const s2_256 = bytesToHex(await sha256Digest(text));
        const s2_512 = bytesToHex(await crypto.subtle.digest('SHA-512', new TextEncoder().encode(text)).then(b => new Uint8Array(b)));

        setText('hash-output-keccak256', k256);
        setText('hash-output-sha3-256', s3_256);
        setText('hash-output-sha256', s2_256);
        setText('hash-output-sha512', s2_512);

        const diffEl = document.getElementById('hash-padding-diff');
        if (diffEl) {
            diffEl.innerHTML = `
                <div class="diff-notice">
                    Notice: <code>Keccak-256</code> vs <code>SHA3-256</code> yield completely different outputs for identical input!
                    This is because Ethereum froze Keccak with <strong>0x01</strong> delimiter padding before NIST finalized FIPS 202 in 2015 with <strong>0x06</strong> domain separation padding.
                </div>
            `;
        }
    }
    if (hashLabInput) hashLabInput.addEventListener('input', updateHashLab);

    // Initial triggers
    await updatePipelineUI();
    updateAvalanche();
    runUniformityTest();
    updateBirthdayUI();
    updateHashLab();
    renderCurveCanvas('canvas-secp-curve', 2);

    // Initial Monte Carlo run
    const initialDist = {};
    for (let i = 0; i < 200; i++) {
        const buf = new Uint8Array(32);
        crypto.getRandomValues(buf);
        const h1 = keccak256(buf);
        buf[0] ^= 1;
        const h2 = keccak256(buf);
        const d = computeHammingDistance(h1, h2);
        initialDist[d] = (initialDist[d] || 0) + 1;
    }
    renderMonteCarloCanvas('canvas-monte-carlo', initialDist, 200);
});
