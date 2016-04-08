package models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import play.data.validation.Constraints;
import play.db.ebean.Model;

import com.avaje.ebean.*;

import javax.persistence.*;
import java.sql.Timestamp;

import java.util.*;
/*
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Connection;
*/
/**
 * Created by wyu on 2/24/16.
 */

@Entity
@Table(name="network_file", uniqueConstraints={
        @UniqueConstraint(columnNames = {"file_type", "file_name"})
})
@JsonIgnoreProperties({"user","fileContent", "modelSharedUsers", "rawDataFile"})
public class NetworkFile extends Model {
    @Id
    public long id;

    @ManyToOne
    @Constraints.Required
    public User user;

    @Constraints.Required
    public String fileName;

    @Constraints.Required
    public String fileType;

    @Constraints.Required
    @Column(columnDefinition="LONGTEXT")
    public String fileContent;

    @Constraints.Required
    public Boolean isPublic = false;

    @OneToOne(mappedBy="networkFile", cascade=CascadeType.ALL)
    public RawDataFile rawDataFile;

    @ManyToMany(cascade=CascadeType.ALL)
    @JoinTable(name="model_shared_users")
    public List<User> modelSharedUsers = new ArrayList<User>();

    @Column(columnDefinition="TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    public Timestamp updateTime;

    public NetworkFile() {}

    public NetworkFile( User user, String fileName, String fileType,
                        String fileContent, Boolean isPublic,
                        List<User> modelSharedUsers ) {
        this.user = user;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileContent = fileContent;
        this.isPublic = isPublic;
        this.modelSharedUsers = modelSharedUsers;
    }

    public static Finder<Long, NetworkFile> find =
            new Finder<Long, NetworkFile>(Long.class, NetworkFile.class);


    public static NetworkFile findByFileNameAndType (
            String fileName, String fileType ) {

        return (NetworkFile) find.where()
                .eq("fileName", fileName)
                .eq("fileType", fileType)
                .findUnique();

        /*
        String sqlString = "SELECT id FROM network_file WHERE user_id=" +
                user.id + " AND file_type=" + fileType + " AND file_name=" + fileName ;

        Connection conn = play.db.DB.getConnection();
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(sqlString);

        if ( rs.next() ) {
            int id = rs.getInt("id");
            NetworkFile networkFile = NetworkFile.findById(id);
        }

        stmt.close();
        conn.close();
        */
    }

    public static List<NetworkFile> findAllPublicNetworkFileList() {
        return (List<NetworkFile>)find.where().eq("isPublic", true).orderBy("fileName asc").findList();
    }
    /*public String toString() {
        return fileName;
    }*/
}
