<script lang="ts">
	import type { PageData } from './$types';
	import { toZonedTime } from 'date-fns-tz';
	export let data: PageData;

	const dataPoints = data.data
		.map((d) => ({
			...d,
			timestamp: new Date(d.timestamp),
			formattedTime: toZonedTime(
				d.timestamp.split(' ').reduce((p: string, c, i) => {
					if (i === 0) {
						return `${c}T`;
					} else if (i === 1) {
						return `${p}${c}Z`;
					} else {
						return p;
					}
				}, ''),
				'Asia/Singapore'
			)
		}))
		.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));
</script>

<div>
	<h1>KL Putrajaya near salak selatan</h1>
	{#each dataPoints as dp}
		<div class="row">
			<p class="time">
				{dp.formattedTime.toLocaleString()}
			</p>
			<p>
				{dp.score}
			</p>
			<img
				src={`https://bision-vision.i-424.workers.dev/?mode=img&imgKey=${dp.img_url.replace('.jpg', '')}`}
				alt="img"
			/>
		</div>
	{/each}
</div>

<style>
	h1 {
		text-align: center;
	}
	div.row {
		display: flex;
		align-items: flex-start;
		width: 100%;
		justify-content: space-between;
		border-top: 1px solid #000;
		padding: 20px;
		box-sizing: border-box;
	}

	div.row p {
		margin: 0;
	}

	div.row img {
		min-width: 150px;
	}
</style>
