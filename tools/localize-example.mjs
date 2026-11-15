/** Translate only declared authored text in the bundled sample; structure stays canonical. */
export function localizeExample(source, messages) {
	const result = structuredClone(source);
	const entities = [
		result,
		...result.intents,
		...result.routes,
		...result.routes.flatMap((r) => r.steps),
		...result.modules,
		...result.chunks,
		...result.intersections,
		...result.estimates,
	];
	const textFields = [
		'title',
		'summary',
		'acceptanceCriteria',
		'name',
		'body',
		'note',
		'label',
		'basis',
	];
	const expected = new Set(entities.map((entity) => entity.id));
	if (Object.keys(messages).some((id) => !expected.has(id)))
		throw new TypeError('Unknown example translation ID');
	for (const entity of entities) {
		const fields = textFields.filter((key) => Object.hasOwn(entity, key));
		const copy = messages[entity.id];
		if (
			!copy ||
			Object.keys(copy).length !== fields.length ||
			Object.keys(copy).some((key) => !fields.includes(key))
		)
			throw new TypeError('Incomplete example translation: ' + entity.id);
		for (const key of fields) {
			const value = copy[key];
			if (
				Array.isArray(entity[key])
					? !Array.isArray(value) ||
						value.length !== entity[key].length ||
						value.some((v) => typeof v !== 'string')
					: typeof value !== 'string'
			)
				throw new TypeError('Invalid example translation: ' + entity.id + '/' + key);
			entity[key] = structuredClone(value);
		}
	}
	return result;
}
