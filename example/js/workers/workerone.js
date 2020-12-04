export default function(master) {

    return master.proto(['mandel'], 
    
    function (mandel) {

        return {

            connect: connection => {
                
                connection.port.post(mandel.create(connection.payload));
            }
        };
    });
};
