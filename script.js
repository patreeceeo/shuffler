
class App {
  bindElements() {
    this.form = document.getElementById('shuffle-form');
    this.itemsInput = document.getElementById('input-list');
    this.randomizerInput = document.getElementById('randomizer');
    this.output = document.getElementById('output');
    this.maxRandomizerSpan = document.getElementById('max-randomizer');
    this.rotationStartInput = document.getElementById('rotation-start');
  }

  constructor() {
    this.factorials = [1];
    for (let i = 1; i <= 20; i++) {
      this.factorials[i] = this.factorials[i - 1] * i;
    }

    this.updateStateFromURL();
  }

  /**
    * Given an integer n, finds the corresponding permutation of the list k
    * @param {number} n - The permutation number, 0 >= n > len(k)!
    * @param {any[]} k - The list to permute
    */
  integerToPermutation(n, k) {
    const { factorials } = this;
    const permutation = [];
    const available = [...k];
    while (available.length > 0) {
      const factorial = factorials[available.length - 1];
      const index = Math.floor(n / factorial);
      n %= factorial;
      permutation.unshift(available[index]);
      available.splice(index, 1);
    }
    return permutation;
  }

  bindEventListeners() {
    const { form, randomizerInput, itemsInput, rotationStartInput } = this;

    form.addEventListener('submit', (event) => {
      event.preventDefault(); // Prevent the form from submitting normally
      this.pushState();
      this.updateStateFromURL();
      this.updateDOMRandomizerInput();
      this.updateDOMOutput();
    });

    randomizerInput.addEventListener('change', () => {
      this.pushState();
      this.updateStateFromURL();
      this.updateDOMRandomizerInput();
      this.updateDOMOutput();
    });

    itemsInput.addEventListener('input', () => {
      this.items = itemsInput.value.split('\n').map(item => item.trim()).filter(item => item !== '');
      this.updateRandomizerMax();
      this.updateDOMRandomizerInput();
      this.updateDOMOutput();
    });

    rotationStartInput.addEventListener('change', () => {
      this.pushState();
      this.updateStateFromURL();
      this.updateDOMOutput();
    });
  }

  pushState() {
    const { itemsInput, randomizerInput, factorials, rotationStartInput } = this;
    const newItems = itemsInput.value.split('\n').map(item => item.trim()).filter(item => item !== '');
    const rmax = factorials[newItems.length] - 1;
    const newRandomizer = Math.min(rmax, Number(randomizerInput.value));

    const params = new URLSearchParams();
    for(const item of newItems) {
      params.append('items', item);
    }
    params.append('randomizer', newRandomizer);
    params.append('rotationStart', rotationStartInput.value);
    window.history.pushState({}, '', `?${params.toString()}`);
  }

  updateStateFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    this.items = urlParams.getAll('items');
    this.updateRandomizerMax();
    this.randomizer = Math.min(this.randomizerMax, Number(urlParams.get('randomizer') || '0'));
    const rotationStartString = urlParams.get('rotationStart');
    if(rotationStartString === null) {
      this.rotationStart = new Date();
    } else {
      this.rotationStart = parseISODateString(urlParams.get('rotationStart'));
    }
  }

  updateDOMFromState() {
    const { itemsInput, items, rotationStartInput } = this;

    itemsInput.value = items.join('\n');

    rotationStartInput.value = formatISODateString(this.rotationStart);

    this.updateDOMRandomizerInput();

    this.updateDOMOutput();
  }

  getIterationName(index) {
    const { rotationStart } = this;
    // Assume weeks start on Sunday
    const startOfNextWeek = new Date(rotationStart.getFullYear(), rotationStart.getMonth(), rotationStart.getDate() + (7 - rotationStart.getDay()));
    // Add 1 week * index
    const iterationDate = new Date(startOfNextWeek.getTime() + (index * 7 * 24 * 60 * 60 * 1000));
    return iterationDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  updateRandomizerMax() {
    this.randomizerMax = this.factorials[this.items.length] - 1
  }

  updateDOMRandomizerInput() {
    const { randomizerInput, randomizer, maxRandomizerSpan, randomizerMax } = this;
    randomizerInput.setAttribute('max', randomizerMax);
    randomizerInput.value = Math.min(randomizer, randomizerMax);
    maxRandomizerSpan.textContent = randomizerMax;
  }

  /**
    * Output in groups of 2 with a header for each group indicating a rotation for the upcoming weeks
    */
  updateDOMOutput() {
    const { output, randomizer, items } = this;
    const permutation = this.integerToPermutation(randomizer, items);
    const outputHtml = permutation.reduce((html, item, index) => {
      if (index % 2 === 0) {
        html += `<h3>${this.getIterationName(index)}</h3><ul>`;
      }
      html += `<li>${item}</li>`;
      if (index % 2 === 1 || index === permutation.length - 1) {
        html += '</ul>';
      }
      return html;
    }, '');
    output.innerHTML = outputHtml;
  }
}

const app = new App();
setTimeout(() => {
  app.bindElements();
  app.bindEventListeners();
  app.updateDOMFromState();
}, 100);


function parseISODateString(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatISODateString(date) {
  return date.toISOString().split('T')[0]
}
