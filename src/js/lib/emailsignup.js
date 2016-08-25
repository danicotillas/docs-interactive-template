import reqwest from 'reqwest'
import formSerialize from 'form-serialize'


export default function emailsignup(formNode) {
    formNode.addEventListener("submit", function(event){
        event.preventDefault();
        var formParams = formSerialize(formNode);

        reqwest({
            url: 'https://api.nextgen.guardianapps.co.uk/email'
            , method: 'post'
            , type: 'json'
            , data: formParams
            , crossOrigin: true
            , complete: function (resp) {
                console.log(resp);
                if(resp.status === 201){
                    console.log("SUCCESS")
                }
                else {
                    console.log("FAILURE");
                }
            }
            // eslint-disable-next-line
            , error: function (err) {
                console.warn(err)
            }
        });
    });

}
