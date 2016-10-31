<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:pmml="http://www.dmg.org/PMML-4_3">
    <xsl:output method="xml" indent="yes"/>
    <xsl:template match="pmml:PMML">
        <smile>
            <xsl:attribute name="version">1.0</xsl:attribute>
            <xsl:attribute name="id">Network5</xsl:attribute>
            <xsl:attribute name="numsamples">1000</xsl:attribute>
            <xsl:attribute name="discsamples">10000</xsl:attribute>
            <xsl:apply-templates select="pmml:DataDictionary"/>
        </smile>
    </xsl:template>

    <xsl:template match="pmml:DataDictionary">
        <nodes>
            <xsl:for-each select="pmml:DataField">
                <xsl:variable name="id" select="@name"/>
                <xsl:variable name="displayName" select="@displayName"/>
                <xsl:variable name="optype" select="@optype"/>

                <xsl:element name="cpt" >
                    <xsl:attribute name="id">
                        <xsl:value-of select="$id"/>
                    </xsl:attribute>
                    <xsl:for-each select="pmml:Value">
                        <xsl:element name="state">
                            <xsl:attribute name="id">
                                <xsl:value-of select="@value"/>
                            </xsl:attribute>
                        </xsl:element>
                    </xsl:for-each>

                    <xsl:call-template name="parents">
                        <xsl:with-param name="id"><xsl:value-of select="$id"/></xsl:with-param>
                    </xsl:call-template>

                    <xsl:element name="probabilities">
                        <xsl:call-template name="probability">
                            <xsl:with-param name="id"><xsl:value-of select="$id"/></xsl:with-param>
                        </xsl:call-template>
                    </xsl:element>
                </xsl:element>

            </xsl:for-each>
        </nodes>
        <extensions>
            <xsl:element name="genie">
                <xsl:attribute name="version">1.0</xsl:attribute>
                <xsl:attribute name="app">GeNIe 2.0.5079.0</xsl:attribute>
                <xsl:attribute name="name">Network5</xsl:attribute>
                <xsl:attribute name="faultnameformat">nodestate</xsl:attribute>
            </xsl:element>

            <xsl:for-each select="pmml:DataField">
                <xsl:variable name="id" select="@name"/>
                <xsl:variable name="displayName" select="@displayName"/>
                <xsl:element name="node">
                    <xsl:attribute name="id"><xsl:value-of select="$id"/></xsl:attribute>
                    <xsl:element name="name">
                        <xsl:value-of select="$displayName"/>
                    </xsl:element>
                </xsl:element>
            </xsl:for-each>
        </extensions>
    </xsl:template>

    <xsl:template name="parents">
        <xsl:param name="id"/>

        <xsl:for-each select="/pmml:PMML/pmml:BayesianNetworkModel/pmml:BayesianNetworkNodes/pmml:DiscreteNode">
            <xsl:if test="$id=@name and pmml:DiscreteConditionalProbability" >
                <xsl:element name="parents">
                    <xsl:for-each select="pmml:DiscreteConditionalProbability[1]/pmml:ParentValue">
                        <xsl:value-of select="@parent"/>
                        <xsl:text> </xsl:text>
                    </xsl:for-each>
                </xsl:element>
            </xsl:if>
        </xsl:for-each>
    </xsl:template>

    <xsl:template name="probability">
        <xsl:param name="id"/>
        <xsl:for-each select="/pmml:PMML/pmml:BayesianNetworkModel/pmml:BayesianNetworkNodes/pmml:DiscreteNode">
            <xsl:if test="$id=@name">
                <xsl:if test="pmml:ValueProbability">
                    <xsl:for-each select="pmml:ValueProbability">
                        <xsl:value-of select="@probability"/>
                        <xsl:text> </xsl:text>
                    </xsl:for-each>
                </xsl:if>
                <xsl:if test="pmml:DiscreteConditionalProbability" >
                     <xsl:for-each select="pmml:DiscreteConditionalProbability/pmml:ValueProbability">
                          <xsl:value-of select="@probability"/>
                        <xsl:text> </xsl:text>
                     </xsl:for-each>
                </xsl:if>
            </xsl:if>
        </xsl:for-each>
    </xsl:template>
</xsl:stylesheet>