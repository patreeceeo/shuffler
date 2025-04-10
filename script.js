
class App {
  bindElements() {
    this.form = document.getElementById('shuffle-form');
    this.itemsInput = document.getElementById('input-list');
    this.randomizerInput = document.getElementById('randomizer');
    this.output = document.getElementById('output');
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
      permutation.push(available[index]);
      available.splice(index, 1);
    }
    return permutation;
  }

  bindEventListeners() {
    const { form, randomizerInput, itemsInput } = this;

    form.addEventListener('submit', (event) => {
      event.preventDefault(); // Prevent the form from submitting normally
      this.pushState();
      this.updateStateFromURL();
      this.updateDOMOutput();
    });

    randomizerInput.addEventListener('change', () => {
      this.pushState();
      this.updateStateFromURL();
      this.updateDOMOutput();
    });

    itemsInput.addEventListener('input', () => {
      this.items = itemsInput.value.split('\n').map(item => item.trim()).filter(item => item !== '');
      this.updateDOMRandomizerInput();
    });
  }

  pushState() {
    const { itemsInput, randomizerInput } = this;
    const newItems = itemsInput.value.split('\n').map(item => item.trim()).filter(item => item !== '');
    const newRandomizer = Number(randomizerInput.value);

    const params = new URLSearchParams();
    for(const item of newItems) {
      params.append('items', item);
    }
    params.append('randomizer', newRandomizer);
    window.history.pushState({}, '', `?${params.toString()}`);
  }

  updateStateFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    this.items = urlParams.getAll('items');
    this.randomizer = Number(urlParams.get('randomizer') || '0');
  }

  updateDOMFromState() {
    const { itemsInput, items } = this;

    itemsInput.value = items.join('\n');

    this.updateDOMRandomizerInput();

    this.updateDOMOutput();
  }

  getIterationName(index) {
    const now = new Date();
    // Assume weeks start on Sunday
    const startOfNextWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - now.getDay()));
    // Add 1 week * index
    const iterationDate = new Date(startOfNextWeek.getTime() + (index * 7 * 24 * 60 * 60 * 1000));
    return iterationDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  updateDOMRandomizerInput() {
    const { randomizerInput, factorials, items, randomizer } = this;
    const max = factorials[items.length] - 1
    randomizerInput.setAttribute('max', max);
    randomizerInput.value = Math.min(randomizer, max);
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


