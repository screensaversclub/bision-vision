import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const req = await fetch(
		//'https://bision-vision.i-424.workers.dev/?cam=KL-PUTRAJAYA%20NEAR%20SALAK%20SELATAN'
		'https://bision-vision.i-424.workers.dev/?cam=PLUS-Selatan%20SUNGAI%20BESI%20TOLL%20KM310.1%20NB'
	);

	const data = (await req.json()) as {
		id: number;
		score: number;
		timestamp: string;
		img_url: string;
		camera: string;
	}[];
	return {
		data: data
	};
};
