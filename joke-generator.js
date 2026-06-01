/**
 * Random Joke Generator
 * Fetches random jokes from the JokeAPI external service
 * 
 * Usage: node joke-generator.js [type]
 * Types: general (default), programming, knock-knock, misc
 */

const https = require('https');

/**
 * Fetches a random joke from JokeAPI
 * @param {string} type - Type of joke (general, programming, knock-knock, misc)
 * @returns {Promise<string>} - Formatted joke string
 */
function fetchJoke(type = 'general') {
  return new Promise((resolve, reject) => {
    const validTypes = ['general', 'programming', 'knock-knock', 'misc'];
    
    if (!validTypes.includes(type)) {
      type = 'general';
    }

    const url = `https://v2.jokeapi.dev/joke/${type}?format=json`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const joke = JSON.parse(data);

          if (joke.error) {
            reject(new Error('Failed to fetch joke: API error'));
          }

          let formattedJoke;
          if (joke.type === 'single') {
            formattedJoke = joke.joke;
          } else if (joke.type === 'twopart') {
            formattedJoke = `${joke.setup}\n\n${joke.delivery}`;
          }

          resolve(formattedJoke);
        } catch (error) {
          reject(new Error('Failed to parse joke response'));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Network error: ${error.message}`));
    });
  });
}

/**
 * Display a random joke with formatting
 */
async function displayJoke() {
  const type = process.argv[2] || 'general';

  console.log('\n🎭 Random Joke Generator\n');
  console.log(`Fetching ${type} joke...\n`);

  try {
    const joke = await fetchJoke(type);
    console.log('📝 ' + joke);
    console.log('\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  displayJoke();
}

module.exports = { fetchJoke };
