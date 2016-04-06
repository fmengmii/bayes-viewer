package models;

import play.data.validation.Constraints;
import play.db.ebean.Model;

import javax.persistence.*;
import java.sql.Timestamp;
import java.util.List;

/**
 * Created by wyu on 3/31/16.
 */

@Entity
public class Log extends Model {
    @Id
    public long id;

    @Constraints.Required
    @ManyToOne
    @JoinColumn(name="network_file_id", referencedColumnName="id", nullable=true)
    public NetworkFile networkFile;

    @ManyToOne
    @JoinColumn(name="user_id", referencedColumnName="id")
    public User user;

    @Column(name="public_user_IP")
    public String publicUserIP;

    @Constraints.Required
    public String operation;

    @Column(columnDefinition="TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    public Timestamp updateTime;

    public Log() {}

    public Log( NetworkFile networkFile, User user,
                String publicUserIP, String operation ) {
        this.networkFile = networkFile;
        this.user = user;
        this.publicUserIP = publicUserIP;
        this.operation = operation;
    }

    public static Finder<Long, Log> find =
            new Finder<Long, Log>(Long.class, Log.class);


    public static List<Log> findByNetworkFile (NetworkFile networkFile ) {
        return (List<Log>) find.where()
                .eq("networkFile", networkFile)
                .orderBy("id desc")
                .findList();
    }

    //make JSON display as a string
    public String getUpdateTime() {
        return updateTime.toString();
    }
}
