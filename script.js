/**
 * Word Character Shuffler - Core Logic & Interactions
 * Features: Fisher-Yates Scrambler, Typoglycemia Mode, Casing Preservation,
 * Web Audio Synthesizer, Live Matrix Inspector, Clipboard Utilities.
 */

(function () {
  'use strict';

  // --- DOM Elements ---
  const textInput = document.getElementById('text-input');
  const textOutput = document.getElementById('text-output');
  const shuffleModeSelect = document.getElementById('shuffle-mode');
  const preservePunctCheck = document.getElementById('preserve-punct');
  const preserveCaseCheck = document.getElementById('preserve-case');
  const liveModeCheck = document.getElementById('live-mode');
  const soundToggleCheck = document.getElementById('sound-toggle');
  
  const currentModeTag = document.getElementById('current-mode-tag');
  const reshuffleBtn = document.getElementById('reshuffle-btn');
  const copyBtn = document.getElementById('copy-btn');
  const clearBtn = document.getElementById('clear-btn');
  const pasteBtn = document.getElementById('paste-btn');

  const inputWordCount = document.getElementById('input-word-count');
  const inputCharCount = document.getElementById('input-char-count');
  const outputWordCount = document.getElementById('output-word-count');
  const scrambledWordsCount = document.getElementById('scrambled-words-count');

  const sampleCambridgeBtn = document.getElementById('sample-cambridge');
  const sampleQuoteBtn = document.getElementById('sample-quote');
  const samplePangramBtn = document.getElementById('sample-pangram');

  const toggleInspectorBtn = document.getElementById('toggle-inspector-btn');
  const interactiveInspector = document.getElementById('interactive-inspector');
  const closeInspectorBtn = document.getElementById('close-inspector-btn');
  const wordChipsContainer = document.getElementById('word-chips-container');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  // --- Web Audio Context for Micro-interactions ---
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtxClass();
    }
  }

  function playUiSound(type = 'shuffle') {
    if (!soundToggleCheck.checked) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'shuffle') {
        // High playful blip
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'copy') {
        // Cheerful chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.setValueAtTime(720, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.17);
      } else if (type === 'chip') {
        // Subtle click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch {
      // Audio playback fails gracefully if blocked by autoplay policies
    }
  }

  // --- Toast Notification ---
  let toastTimer = null;
  function showToast(message) {
    if (toastMessage) toastMessage.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  // --- Fisher-Yates Shuffle Algorithm ---
  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Shuffles an array with a retry attempt so that if there are at least 2 distinct
   * elements, the result isn't trivially identical to the input.
   */
  function robustShuffle(arr) {
    if (arr.length <= 1) return [...arr];
    const originalStr = arr.join('');
    
    // Check if there are at least 2 distinct characters
    const hasVariety = new Set(arr).size > 1;
    if (!hasVariety) return [...arr];

    let result = shuffleArray(arr);
    let attempts = 0;
    while (result.join('') === originalStr && attempts < 10) {
      result = shuffleArray(arr);
      attempts++;
    }
    return result;
  }

  /**
   * Scramble a single word string based on the chosen mode and options.
   */
  function scrambleSingleWord(word, mode, preserveCase) {
    if (!word || word.length <= 1) return word;

    // Record original casing mask if enabled
    const casingMask = [];
    if (preserveCase) {
      for (let i = 0; i < word.length; i++) {
        casingMask.push(word[i] === word[i].toUpperCase() && word[i] !== word[i].toLowerCase());
      }
    }

    const chars = Array.from(word);
    let scrambledChars = [];

    switch (mode) {
      case 'typoglycemia':
        if (chars.length <= 3) {
          scrambledChars = [...chars];
        } else {
          const first = chars[0];
          const last = chars[chars.length - 1];
          const middle = chars.slice(1, chars.length - 1);
          const shuffledMiddle = robustShuffle(middle);
          scrambledChars = [first, ...shuffledMiddle, last];
        }
        break;

      case 'reverse':
        scrambledChars = [...chars].reverse();
        break;

      case 'inner-reverse':
        if (chars.length <= 3) {
          scrambledChars = [...chars];
        } else {
          const first = chars[0];
          const last = chars[chars.length - 1];
          const middle = chars.slice(1, chars.length - 1).reverse();
          scrambledChars = [first, ...middle, last];
        }
        break;

      case 'all':
      default:
        scrambledChars = robustShuffle(chars);
        break;
    }

    // Apply casing mask back onto the scrambled characters
    if (preserveCase && casingMask.length === scrambledChars.length) {
      for (let i = 0; i < scrambledChars.length; i++) {
        if (casingMask[i]) {
          scrambledChars[i] = scrambledChars[i].toUpperCase();
        } else {
          scrambledChars[i] = scrambledChars[i].toLowerCase();
        }
      }
    }

    return scrambledChars.join('');
  }

  /**
   * Process a single token (which could have attached punctuation).
   */
  function processToken(token, mode, preservePunct, preserveCase) {
    if (!preservePunct) {
      return scrambleSingleWord(token, mode, preserveCase);
    }

    // Isolate leading punctuation, word core, and trailing punctuation
    // Matches: (any leading non-word)(word characters)(any trailing non-word)
    const punctRegex = /^([^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]*)(.*?)([^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]*)$/u;
    const match = token.match(punctRegex);

    if (!match) {
      return scrambleSingleWord(token, mode, preserveCase);
    }

    const leading = match[1] || '';
    const core = match[2] || '';
    const trailing = match[3] || '';

    if (!core) {
      return token;
    }

    const scrambledCore = scrambleSingleWord(core, mode, preserveCase);
    return leading + scrambledCore + trailing;
  }

  /**
   * Full text shuffler: parses lines, paragraphs, spaces, and individual words.
   */
  function shuffleFullText(rawText, mode, preservePunct, preserveCase) {
    if (!rawText) return { output: '', wordsList: [] };

    const wordsList = [];
    
    // Split by whitespace boundaries while preserving linebreaks and whitespace structure
    const tokens = rawText.split(/(\s+)/);

    const processedTokens = tokens.map(token => {
      // If whitespace (spaces, tabs, newlines), pass through directly
      if (/^\s+$/.test(token)) {
        return token;
      }

      const scrambled = processToken(token, mode, preservePunct, preserveCase);

      // Extract core word for the inspector
      const cleanOriginal = token.replace(/^[^\w]+|[^\w]+$/gu, '').trim();
      const cleanScrambled = scrambled.replace(/^[^\w]+|[^\w]+$/gu, '').trim();

      if (cleanOriginal) {
        wordsList.push({
          original: cleanOriginal,
          scrambled: cleanScrambled,
          isModified: cleanOriginal !== cleanScrambled
        });
      }

      return scrambled;
    });

    return {
      output: processedTokens.join(''),
      wordsList: wordsList
    };
  }

  // --- UI Update & Synchronization ---
  function updateCounters(inputText, wordsList) {
    const trimmed = inputText.trim();
    const charCount = inputText.length;
    const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    
    inputCharCount.textContent = charCount.toLocaleString();
    inputWordCount.textContent = wordCount.toLocaleString();
    outputWordCount.textContent = wordCount.toLocaleString();

    const modifiedCount = wordsList.filter(w => w.isModified).length;
    scrambledWordsCount.textContent = modifiedCount.toLocaleString();
  }

  function renderInspectorChips(wordsList) {
    if (!interactiveInspector || interactiveInspector.classList.contains('hidden')) {
      return;
    }

    if (!wordsList || wordsList.length === 0) {
      wordChipsContainer.innerHTML = '<span class="empty-chips-msg">Type some words in the input to explore the word matrix.</span>';
      return;
    }

    const fragment = document.createDocumentFragment();

    wordsList.slice(0, 80).forEach(item => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'word-chip';
      chip.title = `Original: "${item.original}" → Shuffled: "${item.scrambled}"`;

      if (item.isModified) {
        chip.innerHTML = `
          <span class="chip-original">${escapeHtml(item.original)}</span>
          <span class="chip-arrow">→</span>
          <span class="chip-scrambled">${escapeHtml(item.scrambled)}</span>
        `;
      } else {
        chip.innerHTML = `
          <span class="chip-unchanged">${escapeHtml(item.scrambled)}</span>
        `;
      }

      chip.addEventListener('click', () => {
        playUiSound('chip');
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(item.scrambled);
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
        }
      });

      fragment.appendChild(chip);
    });

    if (wordsList.length > 80) {
      const moreMsg = document.createElement('span');
      moreMsg.className = 'empty-chips-msg';
      moreMsg.textContent = `+ ${wordsList.length - 80} more words...`;
      fragment.appendChild(moreMsg);
    }

    wordChipsContainer.innerHTML = '';
    wordChipsContainer.appendChild(fragment);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Main Execution Handler ---
  let debounceTimeout = null;
  let lastWordsList = [];

  function executeShuffle(shouldPlaySound = false) {
    const rawText = textInput.value;
    const mode = shuffleModeSelect.value;
    const preservePunct = preservePunctCheck.checked;
    const preserveCase = preserveCaseCheck.checked;

    // Update label tag
    const selectedOption = shuffleModeSelect.options[shuffleModeSelect.selectedIndex];
    if (currentModeTag) {
      currentModeTag.textContent = selectedOption ? selectedOption.text.split('(')[0].trim() : mode;
    }

    const { output, wordsList } = shuffleFullText(rawText, mode, preservePunct, preserveCase);
    textOutput.value = output;
    lastWordsList = wordsList;

    updateCounters(rawText, wordsList);
    renderInspectorChips(wordsList);

    if (shouldPlaySound && rawText.trim()) {
      playUiSound('shuffle');
    }
  }

  function handleInputDebounced() {
    if (!liveModeCheck.checked) return;
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      executeShuffle(false);
    }, 40);
  }

  // --- Event Listeners ---
  textInput.addEventListener('input', handleInputDebounced);

  shuffleModeSelect.addEventListener('change', () => {
    executeShuffle(true);
  });

  preservePunctCheck.addEventListener('change', () => {
    executeShuffle(true);
  });

  preserveCaseCheck.addEventListener('change', () => {
    executeShuffle(true);
  });

  liveModeCheck.addEventListener('change', () => {
    if (liveModeCheck.checked) {
      executeShuffle(false);
    }
  });

  reshuffleBtn.addEventListener('click', () => {
    // Add visual spin
    reshuffleBtn.classList.add('spinning');
    setTimeout(() => reshuffleBtn.classList.remove('spinning'), 500);

    executeShuffle(true);
    showToast('Characters reshuffled!');
  });

  // Copy to Clipboard
  copyBtn.addEventListener('click', async () => {
    const textToCopy = textOutput.value;
    if (!textToCopy) {
      showToast('Nothing to copy yet!');
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        textOutput.select();
        document.execCommand('copy');
      }
      playUiSound('copy');
      showToast('Copied shuffled text to clipboard!');
    } catch {
      textOutput.select();
      document.execCommand('copy');
      showToast('Copied to clipboard!');
    }
  });

  // Clear Input
  clearBtn.addEventListener('click', () => {
    textInput.value = '';
    textOutput.value = '';
    textInput.focus();
    executeShuffle(false);
    showToast('Input cleared');
  });

  // Paste Action
  pasteBtn.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          textInput.value = text;
          executeShuffle(true);
          showToast('Pasted from clipboard!');
          return;
        }
      }
      showToast('Please press Ctrl+V to paste');
    } catch {
      showToast('Clipboard access denied. Use Ctrl+V');
    }
  });

  // Sample Loaders
  sampleCambridgeBtn.addEventListener('click', () => {
    textInput.value = `According to a research at Cambridge University, it doesn't matter in what order the letters in a word are, the only important thing is that the first and last letter be at the right place. The rest can be a total mess and you can still read it without problem. This is because the human mind does not read every letter by itself, but the word as a whole.`;
    shuffleModeSelect.value = 'typoglycemia';
    executeShuffle(true);
    showToast('Loaded Cambridge study sample!');
  });

  sampleQuoteBtn.addEventListener('click', () => {
    textInput.value = `Creativity is intelligence having fun. Imagination is more important than knowledge. For knowledge is limited, whereas imagination embraces the entire world, stimulating progress, giving birth to evolution.`;
    executeShuffle(true);
    showToast('Loaded Einstein quote!');
  });

  samplePangramBtn.addEventListener('click', () => {
    textInput.value = `The quick brown fox jumps over the lazy dog while playing a jazz tune on the saxophone! 1234567890`;
    executeShuffle(true);
    showToast('Loaded pangram sample!');
  });

  // Inspector Toggle
  toggleInspectorBtn.addEventListener('click', () => {
    const isHidden = interactiveInspector.classList.toggle('hidden');
    toggleInspectorBtn.setAttribute('aria-expanded', !isHidden);
    if (!isHidden) {
      renderInspectorChips(lastWordsList);
      interactiveInspector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  closeInspectorBtn.addEventListener('click', () => {
    interactiveInspector.classList.add('hidden');
    toggleInspectorBtn.setAttribute('aria-expanded', 'false');
  });

  // Initialize with Cambridge text demo so page is immediately vibrant and engaging
  sampleCambridgeBtn.click();

})();
