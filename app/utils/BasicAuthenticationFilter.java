package utils;

/**
 * Created by wyu on 2/24/16.
 */

import static play.mvc.Results.*;
import play.api.libs.iteratee.*;
import play.api.libs.iteratee.Done;
import play.api.mvc.*;
import play.api.mvc.Result;
import play.libs.Scala;
import play.mvc.*;
//import play.mvc.Action;
//import play.mvc.Result;
//import play.api.mvc.Result;
import scala.Option;
import scala.Tuple2;
import scala.collection.Seq;
import scala.runtime.AbstractFunction1;
//import sun.misc.BASE64Decoder;
import org.apache.commons.codec.binary.Base64;

import java.util.ArrayList;
import java.util.List;

public class BasicAuthenticationFilter implements EssentialFilter {
    public BasicAuthenticationFilter() {
        // left empty
    }

    public EssentialAction apply(final EssentialAction next) {
        return new JavaEssentialAction() {

            @Override
            public EssentialAction apply() {
                return next.apply();
            }

            @Override
            public Iteratee<byte[], Result> apply(RequestHeader rh) {
                Option<String> authorization = rh.headers().get("Authorization");
                if (!authorization.isEmpty()) {
                    String auth = authorization.get();
                    //BASE64Decoder decoder = new BASE64Decoder();
                    String passanduser = auth.split(" ")[1];
                    /*
                    try {
                        String[] pass = new String(decoder.decodeBuffer(passanduser))
                                .split(":");
                        String username = pass[0];
                        String password = pass[1];
                        if ("nicolas".equals(username) && "nicolas".equals(password)) {
                            return next.apply(rh);
                        }
                    } catch (Exception e) {
                        //Nothing
                    }
                    */
                    byte[] byteArray = Base64.decodeBase64(passanduser);
                    String decodedString = new String(byteArray);
                    String[] pass = decodedString.split(":");
                    String username = pass[0];
                    String password = pass[1];
                    if ("nicolas".equals(username) && "nicolas".equals(password)) {
                        return next.apply(rh);
                    }
                }
                List<Tuple2<String, String>> list
                        = new ArrayList<Tuple2<String, String>>();
                Tuple2<String, String> t =
                        new Tuple2<String, String>("WWW-Authenticate",
                                "Basic realm=\"bayes-viewer app\"");
                list.add(t);
                Seq<Tuple2<String, String>> seq = Scala.toSeq(list);

                return Done.apply(
                //        unauthorized("Forbidden access to the bayes-viewer app").getWrappedSimpleResult().withHeaders(seq), null);
                     unauthorized("Forbidden access to the bayes-viewer app").toScala().withHeaders(seq), null);
            }
        };
    }

    public abstract class JavaEssentialAction
            extends AbstractFunction1<RequestHeader, Iteratee<byte[], Result>>
                implements EssentialAction {
    }

}
