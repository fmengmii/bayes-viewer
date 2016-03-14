import play.*;
import play.api.mvc.*;
import play.filters.csrf.CSRFFilter;
import utils.BasicAuthenticationFilter;
import play.api.mvc.EssentialFilter;

public class Global extends GlobalSettings 
{
	@Override
	public void beforeStart(Application app)
	{
	    // TODO Auto-generated method stub
	    super.beforeStart(app);

	    //System.out.println("Global!");
	    //String lib = "/Users/frankmeng/Documents/Projects/mii-workspace/bayes-viewer/lib/libjsmile.jnilib";
	    //System.load(lib);
	    System.setProperty("DYLD_LIBRARY_PATH", "/Users/frankmeng/Documents/Projects/mii-workspace/bayes-viewer/lib");
	}

	@Override
	public <T extends EssentialFilter> Class<T>[] filters() {
		Class[] filters={CSRFFilter.class};
		//Class[] filters={CSRFFilter.class, BasicAuthenticationFilter.class};
		//Class[] filters={BasicAuthenticationFilter.class};
		return filters;
	}
}

