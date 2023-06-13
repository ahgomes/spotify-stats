/**
 * Reworking of asciichart.js 
 * https://github.com/kroitor/asciichart/
 * 
 */

const TOKENS = {
    hor: '─',
    vert: '│',
    point: '•',
    square: ['┌', '┬', '┐', '├', '┼', '┤', '└', '┴', '┘'],
    curved: ['╭', '┬', '╮', '├', '┼', '┤', '╰', '┴', '╯'],
    nbsp: '\xa0',
    nl: '\n',
};

function plot(data, layout = {}) {
    if (typeof (data[0]) == 'number') {
        data = [data]
    }

    let min = layout.min ?? Math.min(...data.map(x => Math.min(...x))),
        max = layout.max ?? Math.max(...data.map(x => Math.max(...x)));
    let range = max - min;
    let offset = layout.offset ?? 3;
    let padding = layout.padding ?? 0;
    let style = layout.style ?? 'square';
    let height = layout.height ?? range;
    let colors = layout.colors ?? [];
    let ratio = range != 0 ? height / range : 1;
    let rmin = Math.round(min * ratio);
    let rmax = Math.round(max * ratio);
    let rows = rmax - rmin;
    let width = Math.max(...data.map(x => x.length));
    let shift = (max + '').length;
    let format = layout.format ?? ((x) => {
        return TOKENS.nbsp.repeat(padding) + (TOKENS.nbsp.repeat(shift) + x.toFixed(2)).slice(-shift - 1)
    })

    let plane = [...Array(rows + 1)].map(_ => Array(width + offset - 1).fill(TOKENS.nbsp));

    for (let y = rmin; y <= rmax; ++y) { // axis + labels
        let label = format(rows > 0 ? max - (y - rmin) * range / rows : y)
        plane[y - rmin][Math.max(offset - label.length, 0)] = label
        plane[y - rmin][offset - 1] = (y == 0) ? TOKENS[style][4] : TOKENS[style][5]
    }

    for (let j = 0; j < data.length; j++) {
        let y0 = Math.round(data[j][0] * ratio) - rmin
        plane[rows - y0][offset - 1] = TOKENS[style][4] // first value

        for (let x = 0; x < data[j].length - 1; x++) { // plot the line
            let y0 = Math.round(data[j][x + 0] * ratio) - rmin
            let y1 = Math.round(data[j][x + 1] * ratio) - rmin
            if (y0 == y1) {
                plane[rows - y0][x + offset] = TOKENS.hor
            } else {
                plane[rows - y1][x + offset] = (y0 > y1) ? TOKENS[style][6] : TOKENS[style][0]
                plane[rows - y0][x + offset] = (y0 > y1) ? TOKENS[style][2] : TOKENS[style][8]
                let from = Math.min(y0, y1)
                let to = Math.max(y0, y1)
                for (let y = from + 1; y < to; y++) {
                    plane[rows - y][x + offset] = TOKENS.vert
                }
            }
        }
    }

    return plane.map(r => r.join('')).join('\n');
}

function test() {
    return plot([
        //[1, 2, 2, 1],
        [1, 2, 3, 4, 10, 10, 10.7, 10, 9.5, 9.2, 9, 8.7, 8.3, 8, 7].reverse()
    ], { padding: 0, height: 5, style: 'curved' });
}

module.exports = {
    test,
};