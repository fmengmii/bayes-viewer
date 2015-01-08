import play.*;

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
}

