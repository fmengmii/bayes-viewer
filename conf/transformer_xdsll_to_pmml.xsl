<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="xml" indent="yes"/>
    <xsl:template match="smile">
        <xsl:element name="PMML">
            <xsl:attribute name="version">
                <xsl:value-of select="'43'"/>
            </xsl:attribute>
            <xsl:apply-templates select="nodes"/>
        </xsl:element>
    </xsl:template>

    <xsl:template match="nodes">
        <DataDictionary>
            <xsl:attribute name="numberOfFields">
                <xsl:value-of select="count(cpt)"/>
            </xsl:attribute>
            <xsl:for-each select="equation">
                <xsl:variable name="id" select="@id"/>
                <xsl:variable name="displayName">
                    <xsl:value-of select="/smile/extensions/genie/node[@id=$id]/name"/>
                </xsl:variable>
                <xsl:element name="DataField">
                    <xsl:attribute name="dataType">double</xsl:attribute>
                    <xsl:attribute name="name">
                        <xsl:value-of select="$id"/>
                    </xsl:attribute>
                    <xsl:attribute name="displayName">
                        <xsl:value-of select="$displayName"/>
                    </xsl:attribute>
                    <xsl:attribute name="optype">continuous</xsl:attribute>
                </xsl:element>
            </xsl:for-each>

            <xsl:for-each select="cpt">
                <xsl:variable name="id" select="@id"/>
                <xsl:variable name="displayName">
                    <xsl:value-of select="/smile/extensions/genie/node[@id=$id]/name"/>
                </xsl:variable>
                <xsl:element name="DataField">
                    <xsl:attribute name="dataType">string</xsl:attribute>
                    <xsl:attribute name="name">
                        <xsl:value-of select="$id"/>
                    </xsl:attribute>
                    <xsl:attribute name="displayName">
                        <xsl:value-of select="$displayName"/>
                    </xsl:attribute>
                    <xsl:attribute name="optype">categorical</xsl:attribute>
                    <xsl:for-each select="state">
                        <xsl:element name="Value">
                            <xsl:attribute name="value">
                                <xsl:value-of select="@id"/>
                            </xsl:attribute>
                        </xsl:element>
                    </xsl:for-each>
                </xsl:element>
            </xsl:for-each>
        </DataDictionary>

        <BayesianNetworkModel>
            <xsl:attribute name="modelName">
                <xsl:value-of select="/smile/extensions/genie/@name"/>
            </xsl:attribute>
            <xsl:attribute name="functionName">sequences</xsl:attribute>
            <xsl:attribute name="isScorable">true</xsl:attribute>

            <BayesianNetworkNodes>
                <xsl:for-each select="cpt">
                    <xsl:variable name="id" select="@id"/>
                    <DiscreteNode>
                        <xsl:attribute name="name">
                            <xsl:value-of select="$id"/>
                        </xsl:attribute>
                        <xsl:if test="not(parents)">
                            <xsl:call-template name="tokenizeString">
                                <xsl:with-param name="list" select="probabilities"/>
                                <xsl:with-param name="delimiter" select="' '"/>
                                <xsl:with-param name="id" select="$id"/>
                                <xsl:with-param name="stateSeqNum" select="number(0)"/>
                            </xsl:call-template>
                        </xsl:if>
                    </DiscreteNode>
                </xsl:for-each>
            </BayesianNetworkNodes>
        </BayesianNetworkModel>
    </xsl:template>

    <xsl:template name="tokenizeString">
        <!--passed template parameter -->
        <xsl:param name="list"/>
        <xsl:param name="delimiter"/>
        <xsl:param name="id"/>
        <xsl:param name="stateSeqNum"/>
        <xsl:choose>
            <xsl:when test="contains($list, $delimiter)">
                <ValueProbability>
                    <xsl:attribute name="value">
                        <xsl:value-of select="/smile/nodes/cpt[id=$id]/state[$stateSeqNum]"/>
                    </xsl:attribute>
                    <xsl:attribute name="probability">
                        <xsl:value-of select="substring-before($list,$delimiter)"/>
                    </xsl:attribute>
                    <!-- get everything in front of the first delimiter
                    <xsl:value-of select="substring-before($list,$delimiter)"/>  -->
                </ValueProbability>
                <xsl:call-template name="tokenizeString">
                    <!-- store anything left in another variable -->
                    <xsl:with-param name="list" select="substring-after($list,$delimiter)"/>
                    <xsl:with-param name="delimiter" select="$delimiter"/>
                    <xsl:with-param name="id" select="$id"/>
                    <xsl:with-param name="stateSeqNum" select="$stateSeqNum+1"/>
                </xsl:call-template>
            </xsl:when>
            <xsl:otherwise>
                <xsl:choose>
                    <xsl:when test="$list = ''">
                        <xsl:text/>
                    </xsl:when>
                    <xsl:otherwise>
                        <color>
                            <xsl:value-of select="$list"/>
                        </color>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

</xsl:stylesheet>