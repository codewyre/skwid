export default {
	branches: ['main'],
	plugins: [
		[
			'@semantic-release/commit-analyzer',
			{
				preset: 'angular',
				releaseRules: [
					{ type: 'docs', scope: 'README', release: 'patch' },
					{ type: 'refactor', release: 'patch' },
					{ type: 'style', release: 'patch' },
				],
				parserOpts: {
					noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
				},
			},
		],
		'@semantic-release/release-notes-generator',
		'@semantic-release/github',
    ['@semantic-release/npm', {
      "pkgRoot": "./projects/skwid-contracts/dist"
    }],
    ['@semantic-release/npm', {
      "pkgRoot": "./projects/skwid/dist"
    }],
    ["@semantic-release/git", {
      "assets": ["package.json"],
      "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
    }]
	],
};
