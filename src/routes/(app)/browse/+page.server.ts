import { getAllGenresWithCounts, getDecadesWithCounts } from "$lib/server/browse";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	const [genres, decades] = await Promise.all([getAllGenresWithCounts(), getDecadesWithCounts()]);
	return { genres, decades };
};
