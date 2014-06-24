var Jsd = undefined;

function sayHello(to) {
    var fjfkldsKfdsajkl;
    return _.template("Hello, <%= name %>!")({name: to});
}

function test() {
    var myVar = 'Hello, World';
    console.log(myvar); // Oops, typoed here. JSHint with undef will complain
}