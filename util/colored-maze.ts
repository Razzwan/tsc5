const BgRed = '\x1b[41m';
const BgGreen = '\x1b[42m';
const BgYellow = '\x1b[43m';
const BgGray = `\x1b[100m`;
/*
 const color = t[0] === 'w' ? '□' : t[0] === 'b' ? '■' : '_';
 */

const MapToStr = {
	'.': `${BgGreen}\x1b[37m . \x1b[0m`,
	'S': `${BgYellow}\x1b[37m S \x1b[0m`,
	'E': `${BgYellow}\x1b[37m E \x1b[0m`,
	'X': `${BgRed}\x1b[37m X \x1b[0m`,
	'?': `${BgGray}\x1b[37m ? \x1b[0m`,
	'!': `${BgYellow}\x1b[37m ! \x1b[0m`,
}

export const coloredMaze = (maze: Array<Array<number | string>>): void => {
	let str = '';
	maze.forEach(arr => {
		str += Array.isArray(arr) ? arr.map((el) => MapToStr[(typeof el === 'string' ? el : String.fromCharCode(el)) as '.'] as any).join('') + '\n' : arr + '\n';
	});

	console.log(str);
}
