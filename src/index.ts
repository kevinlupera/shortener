import { Context, Hono } from 'hono';

const app = new Hono();

app.get('/:slug', async (c: Context) => {
	const slug = c.req.param('slug');
	const redirectTo = await c.env.SHORTENER_KV.get(slug);

	if (redirectTo) {
		return c.redirect(redirectTo, 302);
	}
	return c.json('URL not found', {
		status: 404,
	});
});

app.post('/', async (c: Context) => {
	const data = await c.req.json();
	const longLink = data?.url;
	let slug = Math.random().toString(36).substring(7);
	let existing = await c.env.SHORTENER_KV.get(slug);
	while (existing) {
		slug = Math.random().toString(36).substring(7);
		existing = await c.env.SHORTENER_KV.get(slug);
	}

	await c.env.SHORTENER_KV.put(slug, longLink);

	return c.json({ url: `${c.env.HOST_URL}/${slug}` });
});

export default app;
