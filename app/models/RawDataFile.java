package models;

import play.data.validation.Constraints;
import play.db.ebean.Model;

import com.avaje.ebean.*;

import javax.persistence.*;
import java.sql.Timestamp;

/**
 * Created by wyu on 3/4/16.
 */

@Entity
public class RawDataFile extends Model {
    @Id
    public long id;

    @OneToOne
    @Constraints.Required
    public NetworkFile networkFile;

    @Constraints.Required
    public String fileName;

    @Constraints.Required
    public String fileType;

    @Constraints.Required
    @Column(columnDefinition="TEXT")
    public String fileContent;

    @Constraints.Required
    public Boolean isPublic = false;

    @Column(columnDefinition="TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    public Timestamp updateTime;

    public RawDataFile(){}

    public RawDataFile( NetworkFile networkFile, String fileName,
                        String fileType, String fileContent, Boolean isPublic ) {

        this.networkFile = networkFile;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileContent = fileContent;
        this.isPublic = isPublic;
    }

    public static Finder<Long, RawDataFile> find =
            new Finder<Long, RawDataFile>(Long.class, RawDataFile.class);

    public static RawDataFile findByNetworkFile ( NetworkFile networkFile ) {
        return (RawDataFile) find.where()
                .eq("networkFile", networkFile).findUnique();
    }

}
