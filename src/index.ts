import Anthropic from '@anthropic-ai/sdk';

function base64Encode(buf: ArrayBuffer) {
	let string = '';
	new Uint8Array(buf).forEach((byte) => {
		string += String.fromCharCode(byte);
	});
	return btoa(string);
}

function base64Decode(string: string) {
	string = atob(string);
	const length = string.length,
		buf = new ArrayBuffer(length),
		bufView = new Uint8Array(buf);
	for (var i = 0; i < length; i++) {
		bufView[i] = string.charCodeAt(i);
	}
	return buf;
}

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
	'Access-Control-Max-Age': '86400',
};

export default {
	async fetch(req: Request, env: Env) {
		const params = new URL(req.url).searchParams;

		const mode = params.get('mode');
		const imgKey = params.get('imgKey');
		const cam = params.get('cam');

		if (mode !== null && imgKey !== null) {
			const object = await env.R2.get(imgKey);

			if (object === null) {
				return new Response('Object Not Found', { status: 404 });
			}

			const headers = new Headers(corsHeaders);

			object.writeHttpMetadata(headers);

			return new Response(object.body);
		} else if (cam !== null) {
			const { results } = await env.DB.prepare('SELECT * FROM Results WHERE camera = ?').bind(cam).all();

			return Response.json(results, {
				headers: { ...corsHeaders },
			});
		} else {
			return new Response('Object Not Found', { status: 404 });
		}
	},

	async scheduled(_event: ScheduledEvent, env: Env) {
		const anthropic = new Anthropic({
			apiKey: env.ANTHROPIC_API_KEY,
			baseURL: 'https://gateway.ai.cloudflare.com/v1/424353e86dca02b3e534d0db7eebb15d/bision-vision/anthropic',
		});

		const rand = Math.floor(Math.random() * 10000);
		const key = new Date().toISOString();
		//const url = 'https://datamall.lta.gov.sg/trafficsmart/images/4703_0553_20240420055407_4ff1d0.jpg';
		const url = 'https://p5.fgies.com/bucket-klp/KLP-03.jpg';
		//const url = 'https://qs.fgies.com/bucket-elite/ELITE-01.jpg';
		let upstreamResponse = await fetch(`${url}?${rand}`, {
			headers: {
				Referer: 'https://www.jalanow.com/',
			},
		});

		const text = base64Encode(await upstreamResponse.arrayBuffer());
		const binary = base64Decode(text);

		await env.R2.put(key, binary);

		const msg = await anthropic.messages.create({
			//model: 'claude-3-opus-20240229',
			model: 'claude-3-haiku-20240307',
			max_tokens: 1000,
			temperature: 0,
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: 'out of a score between 0 to 10, 10 being very crowded, how crowded is the road in this image? return just the score as one integer.',
						},
						{
							type: 'image',
							source: {
								type: 'base64',
								media_type: 'image/jpeg',
								data: text,
							},
						},
					],
				},
			],
		});

		const cam = 'KL-PUTRAJAYA NEAR SALAK SELATAN';
		const score = isNaN(Number(msg.content?.[0]?.text)) ? -1 : Number(msg.content?.[0]?.text);
		await env.DB.prepare(`INSERT INTO Results (camera, score, img_url) VALUES ('${cam}', ${score}, '${key}.jpg')`).run();
	},
};
