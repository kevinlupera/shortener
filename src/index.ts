import { Context, Hono } from 'hono';

const app = new Hono();

app.get('/:slug', async (c: Context) => {
	const slug = c.req.param('slug');
	const redirectTo = await c.env.SHORTENER_KV.get(slug);

	if (redirectTo) {
		try {
			const url = new URL(redirectTo);
			if (url.protocol === 'http:' || url.protocol === 'https:') {
				return c.redirect(redirectTo, 302);
			}
		} catch (e) {
			// Invalid URL
		}
	}
	return c.json('URL not found or invalid', {
		status: 404,
	});
});

app.post('/', async (c: Context) => {
	const data = await c.req.json();
	const longLink = data?.url;

	try {
		const url = new URL(longLink);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			return c.json({ error: 'Invalid URL protocol' }, { status: 400 });
		}
	} catch (e) {
		return c.json({ error: 'Invalid URL' }, { status: 400 });
	}

	let slug = Math.random().toString(36).substring(7);
	let existing = await c.env.SHORTENER_KV.get(slug);
	while (existing) {
		slug = Math.random().toString(36).substring(7);
		existing = await c.env.SHORTENER_KV.get(slug);
	}

	await c.env.SHORTENER_KV.put(slug, longLink);

	return c.json({ url: `${c.env.HOST_URL}/${slug}` });
});

app.get('/', (c: Context) => {
	const htmlForm = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>URL Shortener</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .container {
                    background-color: #fff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    width: 100%;
                    max-width: 400px;
                }
                h1 {
                    text-align: center;
                    color: #333;
                }
                form {
                    display: flex;
                    flex-direction: column;
                }
                label {
                    margin-bottom: 8px;
                    color: #555;
                }
                input[type="url"] {
                    padding: 10px;
                    margin-bottom: 10px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                button {
                    padding: 10px;
                    background-color: #007BFF;
                    color: #fff;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-bottom: 10px;
                }
                button:hover {
                    background-color: #0056b3;
                }
                #result-container {
                    margin-top: 10px;
                    text-align: center;
                }
                #result {
                    color: #28a745;
                    font-weight: bold;
                }
                #copy-button {
                    margin-top: 10px;
                    padding: 5px 10px;
                    background-color: #28a745;
                    color: #fff;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                #copy-button:hover {
                    background-color: #218838;
                }
                #reset-button {
                    padding: 5px 10px;
                    background-color: #dc3545;
                    color: #fff;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                #reset-button:hover {
                    background-color: #c82333;
                }
                #error-message {
                    color: #dc3545;
                    font-weight: bold;
                    text-align: center;
                    display: none;
                }
                footer {
                    margin-top: 20px;
                    text-align: center;
                    color: #555;
                }
                footer a {
                    color: #007BFF;
                    text-decoration: none;
                }
                footer a:hover {
                    text-decoration: underline;
                }
            </style>
            <script>
                async function handleSubmit(event) {
                    event.preventDefault();
                    const urlInput = document.getElementById('url');
                    const url = urlInput.value;
                    const errorMessage = document.getElementById('error-message');

                    if (!urlInput.checkValidity()) {
                        errorMessage.textContent = 'Please enter a valid URL.';
                        errorMessage.style.display = 'block';
                        return;
                    }

                    errorMessage.style.display = 'none';

                    const response = await fetch('/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ url })
                    });
                    const result = await response.json();
                    if (result.error) {
                        errorMessage.textContent = result.error;
                        errorMessage.style.display = 'block';
                    } else {
                        document.getElementById('result').textContent = 'Shortened URL: ' + result.url;
                        document.getElementById('result-container').style.display = 'block';
                    }
                }

                function copyToClipboard() {
                    const resultText = document.getElementById('result').textContent;
                    const url = resultText.replace('Shortened URL: ', '');
                    navigator.clipboard.writeText(url).then(() => {
                        alert('URL copied to clipboard');
                    });
                }

                function resetForm() {
                    document.getElementById('url').value = '';
                    document.getElementById('result-container').style.display = 'none';
                    document.getElementById('error-message').style.display = 'none';
                }
            </script>
        </head>
        <body>
            <div class="container">
                <h1>URL Shortener</h1>
                <form onsubmit="handleSubmit(event)">
                    <label for="url">Enter URL:</label>
                    <input type="url" id="url" name="url" required>
                    <button type="submit">Shorten</button>
                    <button type="button" id="reset-button" onclick="resetForm()">Reset</button>
                </form>
                <div id="result-container" style="display: none;">
                    <label id="result"></label>
                    <button id="copy-button" onclick="copyToClipboard()">Copy</button>
                </div>
                <div id="error-message"></div>
            </div>
            <footer>
                <p>Made by <a href="https://kevinlupera.github.io/" target="_blank">Kevin Lupera</a></p>
            </footer>
        </body>
        </html>
    `;
	return c.html(htmlForm);
});

export default app;
