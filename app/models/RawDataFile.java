package models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import play.data.validation.Constraints;
import play.db.ebean.Model;

import com.avaje.ebean.*;

import javax.persistence.*;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by wyu on 3/4/16.
 */

@Entity
@JsonIgnoreProperties({"networkFile", "fileContent", "rawDataSharedUsers"})
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

    @ManyToMany
    @JoinTable(name="raw_data_shared_users")
    public List<User> rawDataSharedUsers = new ArrayList<User>();

    @Column(columnDefinition="TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    public Timestamp updateTime;

    public RawDataFile(){}

    public RawDataFile( NetworkFile networkFile, String fileName,
                        String fileType, String fileContent, Boolean isPublic,
                        List<User> rawDataSharedUsers) {

        this.networkFile = networkFile;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileContent = fileContent;
        this.isPublic = isPublic;
        this.rawDataSharedUsers = rawDataSharedUsers;
    }

    public static Finder<Long, RawDataFile> find =
            new Finder<Long, RawDataFile>(Long.class, RawDataFile.class);

    public static RawDataFile findByNetworkFile ( NetworkFile networkFile ) {
        return (RawDataFile) find.where()
                .eq("networkFile", networkFile).findUnique();
    }

}
