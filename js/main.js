/**
 * Load TopoJSON data of the world and the data of the world wonders
 */

Promise.all([
    d3.json('data/us.json'),
    d3.csv('data/joinTable.csv')
]).then(data => {
    data[1].forEach(d => {
        d.visitors = +d.visitors;
    })

    const usMap = new UsMap({
        parentElement: '#map'
    }, data[0], data[1]);
})
    .catch(error => console.error(error));
